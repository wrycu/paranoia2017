import {computer_die, mutant_die, negative_node_die, node_die} from "./dice/dice.js";
import {roll_paranoia} from "./dice/roll.js";
import item_sheet_v1 from "./items/item_sheet_v1.js";
import {troubleshooter_sheet, losing_it} from "./actors/troubleshooter.js";
import {initiative_start} from "./combat/initiative.js";
import {socket_listener} from "./socket.js";
import {initiative_manager} from "./combat/initiative_manager.js";
import {roll_builder, reroll} from "./dice/roller.js";
import paranoia_item from "./items/item.js";
import paranoia_actor from "./actors/actor.js";
import {create_macro} from "./macros/macro.js";
import {token_HUD} from "./tokens/hud.js";
import {CardManager, deal_card, init_decks} from "./items/cards.js";


Hooks.once("init", async function () {
    CONFIG.module = 'paranoia';
    //CONFIG.Dice.push(CONFIG.Dice.rolls[0]);
    let original_term = CONFIG.Dice.rolls[0];
    CONFIG.Dice.rolls[0] = roll_paranoia;
    //CONFIG.Dice.rolls.push(original_term);
    console.log("hello")
    CONFIG.Dice.terms["c"] = computer_die;
    CONFIG.Dice.terms["m"] = mutant_die;
    CONFIG.Dice.terms["n"] = node_die;
    CONFIG.Dice.terms["x"] = negative_node_die;

    // TODO: move this into a config setup or something
    let paranoia = {
        skill_map: {
            "athletics": "violence",
            "guns": "violence",
            "melee": "violence",
            "throw": "violence",
            "science": "brains",
            "psychology": "brains",
            "bureaucracy": "brains",
            "alpha_complex": "brains",
            "bluff": "chutzpah",
            "charm": "chutzpah",
            "intimidate": "chutzpah",
            "stealth": "chutzpah",
            "operate": "mechanics",
            "engineer": "mechanics",
            "program": "mechanics",
            "demolitions": "mechanics",
        },
        wound_map: {
            0: "healthy",
            1: "hurt",
            2: "injured",
            3: "maimed",
            4: "dead",
        },
        stats: [
            "violence",
            "brains",
            "chutzpah",
            "mechanics",
        ],
        levels: [
            "alpha",
            "level 1",
            "level 2",
            "level 3",
            "level 4",
            "level 5",
        ],
        weights: [
            "small",
            "medium",
            "large",
            "oversize",
        ],
        security_levels: [
            "ultraviolet",
            "orange",
            "infrared",
            "red",
            "violet",
            "yellow",
            "indigo",
            "green",
            "blue",
        ],
    }

    CONFIG.paranoia = paranoia;
    CONFIG.Actor.documentClass = paranoia_actor;
    CONFIG.Item.documentClass = paranoia_item;

    Token.prototype._drawBar = function (number, bar, data) {
        let val = Number(data.value);
        // health is the opposite of what Foundry expects
        // code is taken from the star wars engine, which does the same reversal
        if (data.attribute === "wounds" || data.attribute === "moxie") {
            val = Number(data.max - data.value);
        }

        const pct = Math.clamped(val, 0, data.max) / data.max;
        let h = Math.max(canvas.dimensions.size / 12, 8);
        if (this.height >= 2) h *= 1.6; // Enlarge the bar for large tokens
        // Draw the bar
        let color = number === 0 ? [1 - pct / 2, pct, 0] : [0.5 * pct, 0.7 * pct, 0.5 + pct / 2];
        bar
            .clear()
            .beginFill(0x000000, 0.5)
            .lineStyle(2, 0x000000, 0.9)
            .drawRoundedRect(0, 0, this.w, h, 3)
            .beginFill(PIXI.utils.rgb2hex(color), 0.8)
            .lineStyle(1, 0x000000, 0.8)
            .drawRoundedRect(1, 1, pct * (this.w - 2), h - 2, 2);
        // Set position
        let posY = number === 0 ? this.h - h : 0;
        bar.position.set(0, posY);
    };

    Handlebars.registerHelper("json", JSON.stringify);
    Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue,
        }[operator];
    });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("paranoia", item_sheet_v1, {makeDefault: true});
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("paranoia", troubleshooter_sheet, {makeDefault: true});

    game.settings.register(
        "paranoia",
        "token_configured",
        {
            name: "token_configured",
            hint: "used to track if the tokens have undergone one-time configuration",
            scope: "world",
            type: Boolean,
            default: false,
        }
    );

    game.settings.register(
        "paranoia",
        "wifi_dead_zone",
        {
            name: "Wifi Dead Zone",
            hint: "Is the party currently in a Wifi Dead zone? (disables names, XP, treason star count)",
            scope: "world",
            type: Boolean,
            default: false,
        },
    );

    game.settings.register(
        "paranoia",
        "mutant_power_audio_cue",
        {
            name: "Mutant Power Audio Cue",
            hint: "Audio cue to play for the GM when activating mutant powers",
            config: true,
            scope: "world",
            type: String,
            filePicker: 'audio',
            default: 'sounds/combat/epic-next-horn.ogg',
        },
    );

    //CONFIG.debug.hooks = true;
    game.socket.on("system.paranoia", socket_listener);

    Hooks.on("dropActorSheetData", async function (actor, actor_sheet, item_data) {
        const item = await fromUuid(item_data.uuid);
        let src = item_data.uuid.split('.')[0];
        if (src && src === 'Actor') {
            // the card was already in someone's hand, transfer it without updating state
            let src_actor = item_data.uuid.split('.')[1];
            // no need to delete it if they're rearranging in their own sheet
            if (src_actor !== actor.id) {
                let item_id = (await fromUuid(item_data.uuid)).id;
                await game.actors.get(src_actor).deleteEmbeddedDocuments("Item", [item_id]);
            }
        } else {
            // track that a card was given to a user
            await deal_card(actor.id, item);
        }
    });

    Hooks.on("renderSidebar", async function (sidebar, context, tabs) {
        if (!game.user.isGM) {
            // since we have to make players owners of the card stacks for them to be able to interact with them,
            // hide the tab, so they can't view info about it
            $('[data-tab="cards"]', context).hide();
        }
        return [sidebar, context, tabs];
    });

    const partial_templates = [
        "systems/paranoia/templates/chat/item.html",
    ];
    await loadTemplates(partial_templates);
});

Hooks.on("renderSidebarTab", (app, html, data) => {
    html.find(".chat-control-icon").click(async (event) => {
        console.log("clicked dice roller")
        let builder = new roll_builder({test: 1});
        await builder.display_roll_dialog();
    });
});

Hooks.on("combatStart", async function (combat_info, round_info) {
    if (!game.user.isGM) {
        return;
    }
    let update_form = new initiative_manager(
        {},
        {
            width: "500",
            height: "auto",
            resizable: true,
            title: "Initiative Manager",
        }
    );
    await update_form.render(true);
    // get other clients to open their manager as well
    game.socket.emit("system.paranoia", {"type": "initiative", "subtype": "open_manager"});
    return await initiative_start(combat_info, round_info);
});

Hooks.once("ready", async function () {
    if (!game.settings.get("paranoia", "token_configured")) {
        let token_data = {
            bar1: {
                attribute: 'wounds',
            },
            displayBars: 30, // hovered by anyone
        };
        game.settings.set("core", "defaultToken", token_data);
        game.settings.set("paranoia", "token_configured", true);
    }
    Hooks.on("createMacro", async function (...args) {
        args[0] = await create_macro(args[0])
        return args;
    });

    Hooks.on("hoverToken", (token, mouse_in) => {
        if (mouse_in) {
            token_HUD.add_hud(token);
        } else {
            token_HUD.remove_hud(token);
        }
    });

    Hooks.on("renderChatMessage", (app, html, messageData) => {
        html.on("click", ".reroll", async function () {
            await reroll(messageData);
        });
    });

    Hooks.on("updateActor", (actor, update_data, metadata, id) => {
        if (actor.type !== 'troubleshooter') {
            return;
        }
        if (update_data?.system?.moxie?.value === 0) {
            losing_it(actor);
        }
    })

    await init_decks();

    const card_manager = new CardManager(undefined, {top: "100%", left: "100%"});
    await card_manager.render(true);
});
