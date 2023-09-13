import {paranoia_log} from "../util.js";

export default class paranoia_item extends Item {
    get_item_details() {
        let data = {
            name: this.name,
            img: this.img,
            type: this.type,
            action_order: this?.system.action_order,
            reaction: this?.system.reaction,
            quote: this.system.quote,
        };

        if (["action_card", "mutant_power_card", "equipment_card"].includes(this.type)) {
            data.description = this.system.text;
        } else if (this.type === "bonus_duty_card") {
            data.description = this.system.responsibilities;
        }
        return data;
    }

    /**
     * Determine the base name of a deck/pile for a given card
     * @returns {string} - base name of the deck
     *   e.g. "Action Card" for the "Action Card Deck", "Action Card Held", "Action Card Discard"  set of cards
     */
    determine_deck_base_name() {
        if (this.type === "action_card") {
            return "Action Card";
        } else if (this.type === "bonus_duty_card") {
            return "Bonus Duty";
        } else if (this.type === "equipment_card") {
            return "Equipment";
        } else if (this.type === "mutant_power_card") {
            return "Mutant Power";
        } else if (this.type === "secret_society_card") {
            return "Secret Society";
        } else {
            paranoia_log(`UNKNOWN CARD TYPE: ${this.type}`);
            return "";
        }
    }

    draw_card() {

    }

    async to_bottom_of_deck() {
        paranoia_log(`Placing ${this.name} to bottom of deck`);
        let base_deck = this.determine_deck_base_name();
        const held_pile = game.cards.filter(i => i.name === `${base_deck} Held`)[0];
        const deck_pile = game.cards.filter(i => i.name === `${base_deck} Deck`)[0];
        const selected_card = held_pile.cards.filter(i => i.name === this.name);
        if (selected_card.length > 0) {
            await held_pile.pass(deck_pile, [selected_card[0].id], {chatNotification: false});
            let moved_card = deck_pile.cards.find(i => i.id === selected_card[0].id);
            let length = deck_pile.cards.contents.length;
            // -300,000 is top, -100,000 is bottom
            // so ordering is low to high
            await moved_card.update({sort: length});

        } else {
            ui.notifications.error(`bad game state - could not find ${this.name} in held deck`)
            paranoia_log(`bad game state - could not find ${this.name} in held deck`);
        }
    }

    async discard_card() {
        paranoia_log(`Discarding ${this.name}`);
        await this.play_card()
    }

    async play_card() {
        paranoia_log(`Playing ${this.name}`);
        let base_deck = this.determine_deck_base_name();
        const held_pile = game.cards.filter(i => i.name === `${base_deck} Held`)[0];
        const discarded_pile = game.cards.filter(i => i.name === `${base_deck} Discard`)[0];
        const played_card = held_pile.cards.filter(i => i.name === this.name);
        if (played_card.length > 0) {
            await held_pile.pass(discarded_pile, [played_card[0].id], {chatNotification: false});
        } else {
            ui.notifications.error(`bad game state - could not find ${this.name} in held deck`)
            paranoia_log(`bad game state - could not find ${this.name} in held deck`)
        }
    }
}
