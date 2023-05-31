export default class mutant_power_use extends FormApplication {
    constructor(actor, item_details) {
        super();
        this.actor = actor;
        this.item_details = item_details;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/paranoia/templates/chat/mutant_power_popup.html`,
            id: 'mutant_power_popup',
            title: 'Describe Mutant Power Use',
        });
    }

    getData() {
        // Send data to the template
        return {
            msg: this.exampleOption,
            color: 'red',
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log("got submit")
        console.log(formData);

        const template = "systems/paranoia/templates/chat/mutant_power.html";
        const html = await renderTemplate(
            template,
            {
                item_details: this.item_details,
                actor: this.actor,
                moxie_usage: formData.moxie_usage,
                effect: formData.effect,
            }
        );

        const message_data = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: this.actor.id,
                token: this.actor.token,
                alias: this.actor.name,
            },
            whisper: game.users.filter(i => i.isGM && i.active).map(i => i.id),
        };
        ChatMessage.create(message_data);
    }
}