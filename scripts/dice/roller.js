import {roll_paranoia} from "./roll.js";
import {paranoia_log} from "../util.js";

export class roll_builder extends FormApplication {
    constructor(object, options) {
        super(object, options);
        this.dice = {
            node: 0,
            xode: 0,
            computer: 0,
        };
        this.actor_id;
        this.attr;
        this.skill;
        this.modifier;
        this.reroll = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/paranoia2017/templates/dice/roller.html"
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".attr_selection").on("change", this._handle_attr_change.bind(this));
        html.find(".skill_selection").on("change", this._handle_skill_change.bind(this));
    }

    /**
     * Update the skill list & NODE
     * @param context
     * @private
     */
    _handle_attr_change(context) {
        let node = parseInt($(context.target).val()) + parseInt($(".skill_selection").val()) + this.modifier;
        $(".node_value").val(node);
        this.attr = context.target.options[context.target.options.selectedIndex].text;
        this.dice.node = node;
    }

    /**
     * Update the NODE
     * @param context
     * @private
     */
    _handle_skill_change(context) {
        let node = parseInt($(".attr_selection").val()) + parseInt($(context.target).val()) + this.modifier;
        $(".node_value").val(node);
        this.skill = context.target.options[context.target.options.selectedIndex].text
        this.dice.node = node;
    }

    getData() {
        // could be passed in
        let actor = game.actors.get(this.actor_id);
        let data = {
            dice: this.dice,
            attrs: actor.system.stats,
            skills: actor.system.skills,
            attr: this.attr,
            skill: this.skill,
            modifier: this.modifier,
        };
        return data;
    }

    /**
     * Converts the data into a formula and rolls
     * @param event
     * @param formData
     * @returns {Promise<void>}
     * @private
     */
    async _updateObject(event, formData) {
        paranoia_log(`Skill roller got form update: ${formData}`);
        let formula;
        if (formData.node > 0) {
            formula = `${formData.node}dn`;
        } else {
            formula = `${formData.node}dx`;
        }
        if (formData.computer > 0) {
            formula += ` + ${formData.computer}dc`
        }

        let roll = new roll_paranoia(formula);
        let chat_data;

        if (this.attr && this.skill) {
            chat_data = await renderTemplate(
                "systems/paranoia2017/templates/dice/skill_roll.html",
                {
                    roll: await roll.get_roll_data(),
                    attr: this.attr,
                    skill: this.skill,
                    node: formData.node,
                    dice: this.dice,
                    actor_id: this.actor_id,
                    modifier: this.modifier,
                    reroll: this.reroll,
                },
            );
        } else {
            chat_data = await roll.render();
        }

        let chat_options = {
            speaker: {
                actor: this.actor_id,
            },
            content: chat_data,
            isRoll: true,
            sound: "sounds/dice.wav",
        };
        ChatMessage.create(chat_options);
    }

    /**
     * Display the roller window
     * @param node
     * @param computer
     * @param actor_id
     * @param attr
     * @param skill
     * @param modifier
     * @returns {Promise<void>}
     */
    async display_roll_dialog(node, computer, actor_id, attr = null, skill = null, modifier = 0) {
        this.dice = {
            node: node,
            computer: computer,
        }
        this.actor_id = actor_id;
        this.attr = attr;
        this.skill = skill;
        this.modifier = modifier;
        await this.render(true);
    }

    /**
     * Actually perform the roll
     * @param node
     * @param computer_dice
     * @param attr
     * @param skill
     * @param dice
     * @param actor_id
     * @param modifier
     * @param reroll
     * @returns {Promise<void>}
     */
    async roll(node, computer_dice, attr, skill, dice, actor_id, modifier, reroll) {
        let formula;
        if (node > 0) {
            formula = `${node}dn`;
        } else {
            formula = `${node}dx`;
        }
        if (computer_dice > 0) {
            formula += ` + ${computer_dice}dc`
        }

        let roll = new roll_paranoia(formula);
        let chat_data;

        if (attr && skill) {
            chat_data = await renderTemplate(
                "systems/paranoia2017/templates/dice/skill_roll.html",
                {
                    roll: await roll.get_roll_data(),
                    attr: attr,
                    skill: skill,
                    node: node,
                    dice: dice,
                    actor_id: actor_id,
                    modifier: modifier,
                    reroll: reroll,
                },
            );
        } else {
            chat_data = await roll.render();
        }
        let chat_options = {
            speaker: {
                actor: actor_id,
            },
            content: chat_data,
            isRoll: true,
            sound: "sounds/dice.wav",
        };

        ChatMessage.create(chat_options);
    }
}

export async function reroll(...args) {
    let message = args[0];
    let element = $(message.message.content);
    // check if we are the author, as only the original user can reroll
    if (!message.author.isSelf) {
        paranoia_log("quitting re-roll as I am not the author of this message");
        ui.notifications.error("You cannot re-roll for another user (good try ;))");
        return;
    }
    // extract values to pass to the roller
    let node = $('.reroll', element).attr('data-node');
    let computer_dice = 1;
    let actor_id = $('.reroll', element).attr('data-actor_id');
    let attr = $('.reroll', element).attr('data-attr');
    let skill = $('.reroll', element).attr('data-skill');
    let wounds_value = $('.reroll', element).attr('data-modifier');
    let dice = {
        computer: computer_dice,
    };
    if (node > 0) {
        dice['node'] = node;
        dice['xode'] = 0;
    } else {
        dice['xode'] = node;
        dice['node'] = 0
    }

    let actor = game.actors.get(actor_id);
    if (!actor || actor.system.moxie.value < 1) {
        paranoia_log("aborting re-roll due to lack of actor or insufficient moxie");
        ui.notifications.warn("You must have >= 1 moxie to re-roll");
        return
    }
    await actor.update({system: {moxie: {value: actor.system.moxie.value - 1}}});

    // create the roll builder and roll it with the data we extracted
    let builder = new roll_builder();
    await builder.roll(
        node,
        computer_dice,
        attr,
        skill,
        dice,
        actor_id,
        wounds_value,
        true,
    );
}
