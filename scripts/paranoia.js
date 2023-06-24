import {computer_die, mutant_die, negative_node_die, node_die} from "./dice/dice.js";
import {roll_paranoia} from "./dice/roll.js";
import item_sheet_v1 from "./items/item_sheet_v1.js";
import troubleshooter_sheet from "./actors/troubleshooter.js";
import {initiative_start} from "./combat/initiative.js";
import {socket_listener} from "./socket.js";
import {initiative_manager} from "./combat/initiative_manager.js";
import roll_builder from "./dice/roller.js";
import paranoia_item from "./items/item.js";
import paranoia_actor from "./actors/actor.js";
import {create_macro} from "./macros/macro.js";
import {token_HUD} from "./tokens/hud.js";
import {CardManager, init_decks} from "./items/cards.js";


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
        console.log(data)
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
        "wifi_dead_zone",
        {
            name: "Wifi Dead Zone",
            hint: "Is the party currently in a Wifi Dead zone? (disables names, XP, treason star count)",
            scope: "world",
            type: Boolean,
            default: false,
        },
    );

    //CONFIG.debug.hooks = true;
    game.socket.on("system.paranoia", socket_listener);

    Hooks.on("renderSidebar", async function (sidebar, context, tabs)  {
        if (!game.user.isGM) {
            // since we have to make players owners of the card stacks for them to be able to interact with them,
            // hide the tab, so they can't view info about it
            $('[data-tab="cards"]', context).hide();
        }
        return [sidebar, context, tabs];
    });
});

Hooks.on("renderSidebarTab", (app, html, data) => {
    html.find(".chat-control-icon").click(async (event) => {
        console.log("clicked dice roller")
        let builder = new roll_builder({test: 1});
        await builder.display_roll_dialog();
    });
});

Hooks.on("combatStart", async function (combat_info, round_info) {
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

    await init_decks();
    const defaultDestinyMenu = [
        {
            name: "menu 1",
            icon: '<i class="fas fa-users"></i>',
            callback: () => {
                new GroupManager().render(true);
            },
            minimumRole: CONST.USER_ROLES.GAMEMASTER,
        },
        {
            name: "menu 2",
            icon: '<i class="fas fa-dice-d20"></i>',
            callback: (li) => {
                const messageText = `<button class="ffg-destiny-roll">${game.i18n.localize("SWFFG.DestinyPoolRoll")}</button>`;

                new Map([...game.settings.settings].filter(([k, v]) => v.key.includes("destinyrollers"))).forEach((i) => {
                    game.settings.set(i.namespace, i.key, undefined);
                });

                CONFIG.FFG.DestinyGM = game.user.id;

                ChatMessage.create({
                    user: game.user.id,
                    content: messageText,
                });
            },
            minimumRole: CONST.USER_ROLES.GAMEMASTER,
        },
    ];
    const card_manager = new CardManager(undefined, {menu: defaultDestinyMenu});
    await card_manager.render(true);
});
