import {add_to_decks, remove_from_decks} from "./cards.js";

export default class item_sheet_v1 extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["boilerplate", "sheet", "item", "action_card"],
            width: 520,
            height: 700,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
        });
    }

    /** @override */
    get template() {
        return `systems/paranoia2017/templates/items/${this.item.type}.html`;
    }

    /** @override */
    getData() {
        // Values created here would only be available within this class or on the sheet's HTML template;
        // it would not be available through returning the item entity elsewhere.
        const data = super.getData();
        data.config = CONFIG.paranoia;
        data.is_gm = game.user.isGM;
        return data;
    }

    _updateObject(event, formData) {
        if (this.item.name !== formData['name']) {
            if (game.user.isGM) {
                ui.notifications.warn("Changing card names may break game state. It is not advised.");
            } else {
                // name was changed and the user is not a GM
                ui.notifications.info("To maintain game state, players cannot edit the name of items");
                formData['name'] = this.name;
            }
        }
        super._updateObject(event, formData);
        if (formData['system.exclude_from_deck'] === undefined) {
            formData['system.exclude_from_deck'] = false;
        }
        let changed = formData['system.exclude_from_deck'] !== this.item.system.exclude_from_deck;
        if (changed && formData['system.exclude_from_deck']) {
            remove_from_decks(this.item);
        } else if (changed && !formData['system.exclude_from_deck']) {
            add_to_decks(this.item);
        }
        if (this.name !== formData['name'] && !game.user.isGM) {
            // re-render to show the user that their change did not work
            this.render(true);
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
    }
}

