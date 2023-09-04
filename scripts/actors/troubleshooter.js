import {initiative_manager} from "../combat/initiative_manager.js";
import {roll_builder} from "../dice/roller.js";
import mutant_power_use from "../items/mutant_power_popup.js";

export class troubleshooter_sheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["boilerplate", "sheet", "actor", "troubleshooter"],
            width: 600,
            height: 800,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
        });
    }

    /** @override */
    get template() {
        return `systems/paranoia/templates/actors/${this.actor.type}.html`;
    }

    async _updateObject(event, formData) {
        // wow, the editor is dumb. if someone empties the field and saves it, the editor simply no longer renders
        // so stop people from accidentally making it empty and screwing themselves
        if (formData["system.memory.value"] === "") {
            formData["system.memory.value"] = "<p>Nothing in memory</p>";
        }
        await super._updateObject(event, formData);
    }

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const actorData = context.actor;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData.system;
        context.flags = actorData.flags;

        // Prepare character data and items.
        if (actorData.type === 'troubleshooter') {
            this._prepareItems(context);
            this._prepareCharacterData(context);
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();
        context.config = CONFIG.paranoia;
        context.is_gm = game.user.isGM;

        // Prepare active effects
        //context.effects = prepareActiveEffectCategories(this.actor.effects);

        return context;
    }


    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.delete();
            li.slideUp(200, () => this.render(false));
            item.discard_card();
        });

        html.find('.skill.rollable').click(this._roll_skill.bind(this));
        html.find(".security_level").on("change", this.tattle.bind(this));

        const send_to_chat_menu = {
            name: "Send To Chat",
            icon: '<i class="far fa-comment"></i>',
            callback: (el) => {
                let item_id = el.attr("data-item-id");
                this._send_item_to_chat(item_id);
            },
        };
        const play_menu = {
            name: "Play Card",
            icon: '<i class="far fa-comment"></i>',
            callback: (el) => {
                let item_id = el.attr("data-item-id");
                this.play_card(item_id);
            },
        };
        const bottom_of_deck_menu = {
            name: "Place On Bottom Of Deck",
            icon: '<i class="far fa-comment"></i>',
            callback: (el) => {
                let item_id = el.attr("data-item-id");
                this.bottom_deck(item_id);
            },
        };
        const use_mutant_power = {
            name: "Activate",
            icon: '<i class="far fa-comment"></i>',
            callback: (el) => {
                let item_id = el.attr("data-item-id");
                this._use_mutant_power(item_id);
            },
        };

        new ContextMenu(html, ".item .item-name:not(.mutant_power)", [send_to_chat_menu, play_menu, bottom_of_deck_menu]);
        new ContextMenu(html, ".item .item-name.mutant_power", [use_mutant_power]);
    }

    async bottom_deck(card_id) {
        let item = this.actor.items.get(card_id);
        await item.to_bottom_of_deck();
        item.delete();
    }

    async play_card(card_id) {
        let item = this.actor.items.get(card_id);
        const item_details = item.get_item_details();
        const template = "systems/paranoia/templates/chat/tattle_play.html";
        const html = await renderTemplate(template, {item_details, item});

        const message_data = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: this.actor.id,
                token: this.actor.token,
                alias: this.actor.name,
            },
        };
        ChatMessage.create(message_data);

        await item.play_card();
        item.delete();
    }

    async tattle(context) {
        console.log("tattling")
        console.log(context)
        const template = "systems/paranoia/templates/chat/tattle.html";
        const html = await renderTemplate(template, {level: $(".security_level").find(":selected").val()});

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

    async _use_mutant_power(item_id) {
        let item = this.actor.items.get(item_id);
        console.log(item)
        // TODO: prompt for moxie points spent and what you'd like to do

        const item_details = item.get_item_details();
        const template = "systems/paranoia/templates/chat/item.html";
        const html = await renderTemplate(template, {item_details, item});

        new mutant_power_use(
            this.actor,
            item_details,
        ).render(true);
    }

    async _send_item_to_chat(item_id) {
        let item = this.actor.items.get(item_id);
        console.log(item)

        const item_details = item.get_item_details();
        const template = "systems/paranoia/templates/chat/item.html";
        const html = await renderTemplate(template, {item_details, item});

        const message_data = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: this.actor.id,
                token: this.actor.token,
                alias: this.actor.name,
            },
        };
        ChatMessage.create(message_data);
    }

    async _roll_skill(context) {
        console.log("got skill roll request")
        console.log(context)
        let skill = $(context.target).attr("data-skill");
        console.log(skill)
        console.log(this)
        let skill_val = this.actor.system.skills[skill].value;
        let attr_val = this.actor.system.stats[CONFIG.paranoia.skill_map[skill]].value;
        let wounds_val = this.actor.system.wounds.value * -1;
        let total = skill_val + attr_val + wounds_val;

        let builder = new roll_builder();
        await builder.display_roll_dialog(total, 1, this.actor.id, CONFIG.paranoia.skill_map[skill], skill, wounds_val);
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        console.log(context)
        // Initialize containers.
        const gear = [];
        const features = [];
        const spells = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };

        let actor = context.actor.system;

        // Calculate derived action order values for equipment
        for (let item of context.items) {
            if (item.type === "equipment_card") {
                item.system.action_order = actor.stats[item.system.skill.name].value + parseInt(item.system.skill.bonus);
            }
        }
        console.log(context)

        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'item') {
                gear.push(i);
            }
            // Append to features.
            else if (i.type === 'feature') {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === 'spell') {
                if (i.data.spellLevel != undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
        }

        // Assign and return
        context.gear = gear;
        context.features = features;
        context.spells = spells;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterData(context) {

    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return await Item.create(itemData, {parent: this.actor});
    }
}

export async function losing_it(actor) {
    const template = "systems/paranoia/templates/chat/losing_it.html";
    const html = await renderTemplate(template);

    const message_data = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: html,
        speaker: {
            actor: actor.id,
            token: actor.token,
            alias: actor.name,
        },
    };
    ChatMessage.create(message_data);
}
