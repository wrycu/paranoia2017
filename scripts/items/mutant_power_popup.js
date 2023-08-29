export default class mutant_power_use extends FormApplication {
    constructor(actor, item_details) {
        super();
        this.actor = actor;
        this.item_details = item_details;
        this.initial_message = null;
        this.send_initial_message();
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

    async send_initial_message() {
        let html = "I'm activating a mutant power...";

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
            sound: game.settings.get('paranoia', 'mutant_power_audio_cue'),
        };
        this.initial_message = await ChatMessage.create(message_data);
    }

    getData() {
        return {
            moxie_points: this.actor.system.moxie.value,
        };
    }

    close() {
        this.initial_message.delete();
        super.close();
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log("got submit")
        console.log(formData);

        await this.actor.update(
            {system: {moxie: {value: this.actor.system.moxie.value - parseInt(formData.moxie_usage)}}}
        );


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

        this.initial_message.update({content: html})
    }
}
