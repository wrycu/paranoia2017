import {computer_die, mutant_die, negative_node_die, node_die} from "./dice/dice.js";
import {roll_paranoia} from "./dice/roll.js";
import action_card_sheet from "./items/action_card.js";
import troubleshooter_sheet from "./actors/troubleshooter.js";
import {initiative_start} from "./combat/initiative.js";
import {socket_listener} from "./socket.js";
import {initiative_manager} from "./combat/initiative_manager.js";
import roll_builder from "./dice/roller.js";


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
    }

    CONFIG.paranoia = paranoia;

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
    Items.registerSheet("paranoia", action_card_sheet, {makeDefault: true});
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("paranoia", troubleshooter_sheet, {makeDefault: true});

    //CONFIG.debug.hooks = true;
    game.socket.on("system.paranoia", socket_listener);
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
    return await initiative_start(combat_info, round_info);
});

Hooks.on("combatRound", async function (combat_info, round_info, time_info) {
    console.log("ComBAT ROUND")
    // TODO: remove, just here for easy access to opening
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
    // TODO: remove, just here for easy access for _others_ to open
    game.socket.emit("system.paranoia", {"type": "temp", "subtype": "open_manager"});
    return await initiative_start(combat_info, round_info, time_info);
});
