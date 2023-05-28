import {computer_die, mutant_die, negative_node_die, node_die} from "./dice/dice.js";
import {roll_paranoia} from "./dice/roll.js";
import action_card_sheet from "./items/action_card.js";
import troubleshooter_sheet from "./actors/troubleshooter.js";


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

    Handlebars.registerHelper("json", JSON.stringify);

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("paranoia", action_card_sheet, {makeDefault: true});
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("paranoia", troubleshooter_sheet, {makeDefault: true});
});
