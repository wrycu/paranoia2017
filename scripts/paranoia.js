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
import {register_wifi_dead_zone} from "./init.js";
import {paranoia_log} from "./util.js";
import {ToolTipSettings} from "./ui/settings.js";


Hooks.once("init", async function () {
    CONFIG.module = 'paranoia2017';
    CONFIG.Dice.rolls[0] = roll_paranoia;
    CONFIG.Dice.terms["c"] = computer_die;
    CONFIG.Dice.terms["m"] = mutant_die;
    CONFIG.Dice.terms["n"] = node_die;
    CONFIG.Dice.terms["x"] = negative_node_die;
    game.manager = null;

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
        skills: [
            "athletics",
            "guns",
            "melee",
            "throw",
            "science",
            "psychology",
            "bureaucracy",
            "alpha_complex",
            "bluff",
            "charm",
            "intimidate",
            "stealth",
            "operate",
            "engineer",
            "program",
            "demolitions",
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
    };

    CONFIG.paranoia = paranoia;
    CONFIG.Actor.documentClass = paranoia_actor;
    CONFIG.Item.documentClass = paranoia_item;
    //CONFIG.debug.hooks = true

    // health is the opposite of what Foundry expects
    // code is taken from the star wars engine, which does the same reversal
    Token.prototype._drawBar = function (number, bar, data) {
        let val = Number(data.value);
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

    // register template helpers
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

    // register items
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("paranoia2017", item_sheet_v1, {makeDefault: true});
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("paranoia2017", troubleshooter_sheet, {makeDefault: true});

    // register settings
    game.settings.register(
        "paranoia2017",
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
        "paranoia2017",
        "wifi_dead_zone",
        {
            name: game.i18n.localize("paranoia.settings.wifi_dead_zone.name"),
            hint: game.i18n.localize("paranoia.settings.wifi_dead_zone.hint"),
            scope: "world",
            type: Boolean,
            default: false,
        },
    );
    game.settings.register(
        "paranoia2017",
        "mutant_power_audio_cue",
        {
            name: game.i18n.localize("paranoia.settings.mutant_power_audio_cue.name"),
            hint: game.i18n.localize("paranoia.settings.mutant_power_audio_cue.hint"),
            config: true,
            scope: "world",
            type: String,
            filePicker: 'audio',
            default: 'sounds/combat/epic-next-horn.ogg',
        },
    );
    game.settings.register(
        "paranoia2017",
        "debug_logging",
        {
            name: game.i18n.localize("paranoia.settings.debug_logging.name"),
            hint: game.i18n.localize("paranoia.settings.debug_logging.hint"),
            config: true,
            scope: "world",
            type: Boolean,
            default: false,
        },
    );
    game.settings.register(
        "paranoia2017",
        "tutorial_shown",
        {
            name: "Tutorial Shown",
            hint: "",
            scope: "client",
            type: Boolean,
            default: false,
        },
    );
    game.settings.registerMenu(
        "paranoia2017",
        "skills_and_stats",
        {
            name: game.i18n.localize("paranoia.settings.skills_and_stats.name"),
            label: game.i18n.localize("paranoia.settings.skills_and_stats.label"),      // The text label used in the button
            hint: game.i18n.localize("paranoia.settings.skills_and_stats.hint"),
            icon: "fas fa-bars",               // A Font Awesome icon used in the submenu button
            type: ToolTipSettings,   // A FormApplication subclass which should be created
            restricted: true,                   // Restrict this submenu to gamemaster only?
        },
    );
    game.settings.register(
        "paranoia2017",
        "tooltips",
        {
            name: game.i18n.localize("paranoia.settings.tooltips.name"),
            hint: game.i18n.localize("paranoia.settings.tooltips.hint"),
            config: false,
            scope: "world",
            type: Object,
            default: {
                'enabled': true,
                'stats': {
                    'violence': 'Your GM can set this tooltip in the settings',
                    'brains': 'Your GM can set this tooltip in the settings',
                    'chutzpah': 'Your GM can set this tooltip in the settings',
                    'mechanics': 'Your GM can set this tooltip in the settings',
                },
                'skills': {
                    'athletics': 'Your GM can set this tooltip in the settings',
                    'guns': 'Your GM can set this tooltip in the settings',
                    'melee': 'Your GM can set this tooltip in the settings',
                    'throw': 'Your GM can set this tooltip in the settings',
                    'science': 'Your GM can set this tooltip in the settings',
                    'psychology': 'Your GM can set this tooltip in the settings',
                    'bureaucracy': 'Your GM can set this tooltip in the settings',
                    'alpha_complex': 'Your GM can set this tooltip in the settings',
                    'bluff': 'Your GM can set this tooltip in the settings',
                    'charm': 'Your GM can set this tooltip in the settings',
                    'intimidate': 'Your GM can set this tooltip in the settings',
                    'stealth': 'Your GM can set this tooltip in the settings',
                    'operate': 'Your GM can set this tooltip in the settings',
                    'engineer': 'Your GM can set this tooltip in the settings',
                    'program': 'Your GM can set this tooltip in the settings',
                    'demolitions': 'Your GM can set this tooltip in the settings',
                },
            },
            restricted: true,
        },
    );

    // register the socket listener
    game.socket.on("system.paranoia2017", socket_listener);

    // register hook handlers which need to be after Foundry is initialized
    Hooks.on("dropActorSheetData", async function (actor, actor_sheet, item_data) {
        /*
        Allow drag-and-drop of items, including between actors. handle updating deck state as needed
        */
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
        /*
        Used to hide the deck tab from players.
        They have to be owners of the decks (since they move cards around by playing them), but we don't want
            them to be able to see which cards are in which state
        */
        if (!game.user.isGM) {
            // since we have to make players owners of the card stacks for them to be able to interact with them,
            // hide the tab, so they can't view info about it
            $('[data-tab="cards"]', context).hide();
        }
        return [sidebar, context, tabs];
    });

    // preload templates
    const partial_templates = [
        "systems/paranoia2017/templates/chat/item.html",
    ];
    await loadTemplates(partial_templates);


});

Hooks.on("combatStart", async function (combat_info, round_info) {
    /*
    Used to show the initiative manager since Paranoia uses... weird initiative
    */
    if (!game.user.isGM) {
        return;
    }
    game.manager = await new initiative_manager(
        {},
        {
            width: "500",
            height: "auto",
            resizable: true,
            title: "Initiative Manager",
        }
    );
    await game.manager.render(true);
    // get other clients to open their manager as well
    game.socket.emit("system.paranoia2017", {"type": "initiative", "subtype": "open_manager"});
    return await initiative_start(combat_info, round_info);
});

Hooks.on("getSceneControlButtons", (buttons) => {
    /*
    Used to add wifi dead-zone to scene controls
    */
    if (!game.user.isGM) {
        return;
    }
    return register_wifi_dead_zone(buttons);
});

Hooks.once("ready", async function () {
    configure_token();

    Hooks.on("createMacro", async function (...args) {
        /*
        Kinda nuts that this is not default behavior, but take the item image when creating a macro
        */
        args[0] = await create_macro(args[0])
        return args;
    });

    Hooks.on("hoverToken", (token, mouse_in) => {
        /*
        Used to render the pretty mouse-over HUD
        */
        if (mouse_in) {
            token_HUD.add_hud(token);
        } else {
            token_HUD.remove_hud(token);
        }
    });

    Hooks.on("destroyToken", (token) => {
        token_HUD.remove_hud(token);
    });

    Hooks.on("renderChatMessage", (app, html, messageData) => {
        /*
        Used to hook the spend moxie to re-roll button
        */
        html.on("click", ".reroll", async function () {
            await reroll(messageData);
        });
    });

    Hooks.on("updateActor", (actor, update_data, metadata, id) => {
        /*
        Generic location to handle losing it (0 moxie left)
        */
        if (actor.type !== 'troubleshooter') {
            return;
        }
        paranoia_log("Updating actor...");
        if (update_data?.system?.moxie?.value === 0) {
            paranoia_log("Oh no, the troubleshooter has lost it");
            losing_it(actor);
        }
    })

    // create and populate the decks used to track card state
    await init_decks();

    // show the card manager on the bottom right
    const card_manager = new CardManager(undefined, {top: "100%", left: "100%"});
    await card_manager.render(true);

    if (!game.settings.get('paranoia2017', 'tutorial_shown')) {
        let d = new Dialog({
            title: game.i18n.localize("paranoia.settings.tooltips.name"),
            content: `<p>${game.i18n.localize("paranoia.settings.welcome.message.part_1")}!</p><p>${game.i18n.localize("paranoia.settings.welcome.message.part_2")} <a href='https://github.com/wrycu/paranoia2017/wiki'>in the wiki.</a></p><p>(This message will show only once.)</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Ok",
                    callback: () => console.log("Chose One")
                },
            },
            default: "one",
        });
        d.render(true);
        game.settings.set('paranoia2017', 'tutorial_shown', true);
    }
});

function configure_token() {
    if (!game.settings.get("paranoia2017", "token_configured")) {
        let token_data = {
            bar1: {
                attribute: 'wounds',
            },
            displayBars: 30, // hovered by anyone
        };
        game.settings.set("core", "defaultToken", token_data);
        game.settings.set("paranoia2017", "token_configured", true);
    }
}
