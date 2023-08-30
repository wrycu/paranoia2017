import {roll_paranoia} from "./roll.js";

export default class roll_builder extends FormApplication {
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
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/paranoia/templates/dice/roller.html"
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".attr_selection").on("change", this._handle_attr_change.bind(this));
        html.find(".skill_selection").on("change", this._handle_skill_change.bind(this));
    }

    _handle_attr_change(context) {
        let node = parseInt($(context.target).val()) + parseInt($(".skill_selection").val());
        $(".node_value").val(node);
        this.attr = context.target.options[context.target.options.selectedIndex].text
    }

    _handle_skill_change(context) {
        let node = parseInt($(".attr_selection").val()) + parseInt($(context.target).val()) + this.modifier;
        $(".node_value").val(node);
        this.skill = context.target.options[context.target.options.selectedIndex].text
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

    async _updateObject(event, formData) {
        console.log("_updateobject")
        console.log(event)
        console.log(formData)
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
                "systems/paranoia/templates/dice/skill_roll.html",
                {
                    roll: await roll.get_roll_data(),
                    attr: this.attr,
                    skill: this.skill,
                    node: formData.node,
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

    async display_roll_dialog(node, computer, actor_id, attr=null, skill=null, modifier=0) {
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
}
