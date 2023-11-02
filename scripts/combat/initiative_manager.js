import {card_discarder} from "./card_discarder.js";
import mutant_power_use from "../items/mutant_power_popup.js";
import {paranoia_log} from "../util.js";
import {remove_from_decks} from "../items/cards.js";

export class initiative_manager extends FormApplication {
    constructor(object, options) {
        super(object, options)
        this.selected_cards = {};
        this.initiative_slot = 10;
        this.gone_this_round = false;
        this.challenged_this_round = false;
        this.setup_hooks();
        this.setup_initiative();
        this.get_combatants();
    }


    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/paranoia2017/templates/combat/initiative_manager.html"
        });
    }

    /**
     * Close the manager when combat ends
     */
    setup_hooks() {
        Hooks.on("deleteCombat", this.custom_close.bind(this));
        delete this;
    }

    /**
     * Probit accidentally closing the manager
     */
    close() {
        return;
    }

    /**
     * Allow closing via a custom function
     */
    custom_close() {
        super.close();
    }

    /**
     * Prepares for card selection
     */
    setup_initiative() {
        paranoia_log("Setting up initiative");
        this.selected_cards = 1
        this.initiative_slot = 10;
        this.gone_this_round = false;
        this.challenged_this_round = false;
        // can't access "this" in the foreach
        let selected_cards = {}
        let combatants = this.get_combatants();

        combatants.forEach(function (combatant) {
            selected_cards[combatant.actor_id] = {
                name: combatant.user_name,
                is_selected: false,
                selected_card: {
                    name: null,
                    id: null,
                    action_order: null,
                },
                is_me: combatant.is_me,
            };
        });

        this.selected_cards = selected_cards;
        this.slots = [];
        this.lost_challenge = [];
        this.stage = "stage_1";
    }

    async getData(options = {}) {
        let data = await super.getData();
        data.is_gm = game.user.isGM;
        data.users = game.users.filter(i => i.active).map(i => i.name);
        data.selected_cards = this.selected_cards;
        data.selection_disabled = false;
        data.available_cards = [];
        data.slots = this.slots;
        data.stage = this.stage;
        data.lost_challenge = this.lost_challenge;

        if (game.user.isGM) {
            data.my_id = null;
            data.initiative_slot = this.initiative_slot;
            data.gone_this_round = true;
            data.challenged_this_round = true;
        } else {
            data.my_id = game.user.character.id;
            let actor = game.user.character.system;
            let items = game.user.character.items.filter(i => ["action_card", "equipment_card", "mutant_power_card"].includes(i.type));
            if (items.length > 0) {
                for (let item of items) {
                    // derived values on items are not calculated when accessing outside a sheet
                    if (item.type === "equipment_card") {
                        item.system.action_order = actor.stats[item.system.skill.name].value + parseInt(item.system.skill.bonus);
                    }
                    const item_details = item.get_item_details();
                    const template = "systems/paranoia2017/templates/chat/item.html";
                    item.html = await renderTemplate(template, {item_details, item});
                    data.available_cards.push(item);
                }
            }
            data.initiative_slot = this.initiative_slot;
            data.gone_this_round = this.gone_this_round;
            data.challenged_this_round = this.challenged_this_round;
        }
        paranoia_log(`Retrieved the following data`);
        paranoia_log(data);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        // TODO: refactor to use initial / real handlers
        html.find(".progress_combat").click(this.initial_stage_transition.bind(this));
        html.find(".card_selection").on("change", this.handle_my_card_selection.bind(this));
        html.find(".initiative_next").click(this.initial_initiative_next.bind(this));
        html.find(".initiative_select").click(this.handle_initial_initiative_select.bind(this));
        html.find(".challenge_initiative").click(this.initial_challenge.bind(this));
    }

    /**
     * Initiator for stage_transition; see notes there
     * @param context
     */
    initial_stage_transition(context) {
        paranoia_log("Caught stage transition");
        let new_stage;
        if (this.stage === "stage_1") {
            new_stage = "stage_2";
        } else {
            new_stage = "stage_1";
        }

        let data = {
            type: "initiative",
            subtype: "stage_transition",
            data: {
                new_stage
            }
        };

        game.socket.emit("system.paranoia2017", data);
        this.stage_transition(data);
    }

    /**
     * Handle stage transitions (between card and slot selection)
     * @param data - data from socket
     */
    stage_transition(data) {
        this.stage = data.data.new_stage;
        if (this.stage === "stage_1") {
            this.setup_initiative();
        }
        this.render();
    }

    /**
     * Lost an initiative bluff
     * @param data
     * @private
     */
    process_lost_challenge(data) {
        paranoia_log("Challenge loss");
        this.lost_challenge.push(data.data.player_name);
        let tmp_array = [];
        this.slots[9 - this.initiative_slot].actors.forEach(function (slot_data) {
            if (slot_data.player_id !== data.data.player_id) {
                tmp_array.push(slot_data);
            } else {
                console.log("found match")
            }
        });
        this.slots[9 - this.initiative_slot].actors = tmp_array;
        this.render();
    }

    async initial_challenge(context) {
        paranoia_log("I have issued an initiative challenge");
        let challenged_player = $(context.target).attr("data-player-id");
        let challenged_index = parseInt($(context.target).attr("data-slot"));
        this.challenged_this_round = true;
        paranoia_log(`Challenged player: ${challenged_player} / ${challenged_index}`);
        let data = {
            type: "initiative",
            subtype: "challenge_start",
            data: {
                challenger_id: game.user.character.id,
                challenged_id: challenged_player,
                challenged_index: challenged_index,
            }
        }

        const html = await renderTemplate(
            "systems/paranoia2017/templates/combat/initiative_challenge_start.html",
            {
                other_person: game.actors.get(challenged_player).name,
            },
        );

        const message_data = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: game.user.character.id,
            },
        };
        ChatMessage.create(message_data);

        this.challenge(data);
        game.socket.emit("system.paranoia2017", data);
    }

    /**
     * Called if you are the target of a challenge
     * @param data - socket data
     * @private
     */
    challenge(data) {
        paranoia_log(`Received challenge notification: ${data}`);
        if (!game.user.isGM && data.data.challenged_id === game.user.character.id) {
            // I am the one who was challenged; perform specific steps
            paranoia_log("(And I was the person challenged)");
            // determine: was I lying about the initiative?
            // value I'm supposed to have
            let target_value = 10 - data.data.challenged_index;
            let actual_value = parseInt($(".stage_2_selected_card").attr("data-action-order"));
            paranoia_log(`I claimed to have an initiative of ${target_value} but actually had ${actual_value}`);
            if (target_value !== actual_value && actual_value < target_value) {
                paranoia_log("I was lying :|");
                this.challenge_lied(data.data.challenger_id);
            } else {
                paranoia_log("I was telling the truth");
                this.challenge_truth(data.data.challenger_id);
            }
        } else {
            paranoia_log("I was not the person being challenged; updating tracker to reflect that a challenge happened");
            // notify users that it's already been challenged by updating the slot
            let updated_data = [];
            this.slots[data.data.challenged_index].actors.forEach(function (actor) {
                if (actor.player_id === data.data.challenged_id) {
                    actor.challenged = true;
                }
                updated_data.push(actor);
            });
            this.slots[data.data.challenged_index].actors = updated_data;
        }
        this.render();
    }

    /**
     * The challenge has been resolved. I was the target and I lied.
     * @param challenger_id
     * @returns {Promise<void>}
     */
    async challenge_lied(challenger_id) {
        paranoia_log(`I lose the challenge to ${challenger_id}`);
        // TODO: insert the challenger in the initiative
        const html = await renderTemplate(
            "systems/paranoia2017/templates/combat/initiative_challenge_correct.html",
            {
                challenger: game.actors.get(challenger_id).name,
            },
        );

        const message_data = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                actor: game.user.character.id,
            },
        };
        ChatMessage.create(message_data);
        this.discard_card(game.user.character.id, $(".stage_2_selected_card").attr("data-card-id"));

        let data = {
            "type": "initiative",
            "subtype": "lost_challenge",
            "data": {
                "player_name": game.user.character.name,
                "player_id": game.user.character.id,
            },
        };
        game.socket.emit("system.paranoia2017", data);

        this.process_lost_challenge(data);
    }

    /**
     * The challenge has been resolved. I was the target and I did not lie.
     * @param challenger_id
     * @returns {Promise<void>}
     */
    challenge_truth(challenger_id) {
        paranoia_log(`I won the challenge from ${challenger_id}`);
        let data = {
            type: "initiative",
            subtype: "challenge_loss",
            data: {
                challenger_id: challenger_id,
            }
        };
        game.socket.emit("system.paranoia2017", data);
    }

    /**
     * A challenge was issued and was wrong
     * @param data - data from socket
     * @returns {Promise<void>}
     * @private
     */
    async challenge_wrong(data) {
        paranoia_log(`Challenge was wrong: ${data}`);
        if (!game.user.isGM && data.data.challenger_id === game.user.character.id) {
            paranoia_log("I was the challenger, discarding");
            let my_actor = game.actors.get(game.user.character.id);
            let possible_cards = my_actor.items.filter(i => i.type === "action_card");
            let buttons = {};
            possible_cards.forEach(function (card, index) {
                buttons[`button${index}`] = {
                    label: card.name,
                    callback: () => card_discarder(game.user.character.id, card.id),
                    icon: `<i class="fas fa-check"></i>`,
                }
            });
            new Dialog({
                title: "Select an action card to discard",
                content: `Incorrect challengers must choose and discard an action card`,
                buttons: buttons,
            }).render(true);

            const html = await renderTemplate(
                "systems/paranoia2017/templates/combat/initiative_challenge_incorrect.html",
            );
            const message_data = {
                user: game.user.id,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                content: html,
                speaker: {
                    actor: game.user.character.id,
                },
            };
            ChatMessage.create(message_data);
        }
    }

    discard_card(actor_id, card_id) {
        let actor = game.actors.get(actor_id);
        let item = actor.items.get(card_id);
        if (item?.type !== "mutant_power_card") {
            card_discarder(actor_id, card_id);
        }
    }

    /**
     * Initial functions collect relevant data, invoke the actual handler, then emit the event
     * This architecture is used so that the same code is handling the same event regardless of if it was locally or not
     * Hopefully, this avoids annoying bugs due to slightly divergent code paths
     *
     * Handles the GM clicking the "next slot" button (e.g. moving the initiative forward)
     * @param context
     * @private
     */
    handle_initial_initiative_select(context) {
        paranoia_log("I've selected a card");
        console.log(context)
        let data = {
            type: "initiative",
            subtype: "player_initiative_select",
            data: {
                player_id: game.user.character.id,
                player_name: game.user.character.name,
                challenged: false,
                contains_me: false,
            }
        };
        game.socket.emit("system.paranoia2017", data);
        // update value for local usage
        data.data.contains_me = true;
        this.handle_initiative_select(data);
        // local only update
        this.gone_this_round = true;
    }

    /**
     * Update the local data and rerender to show that someone has selected a card
     * @param data
     * @private
     */
    handle_initiative_select(data) {
        // index is forward but countdown is backwards
        this.slots[9 - this.initiative_slot].actors.push({
            player_id: data.data.player_id,
            player_name: data.data.player_name,
            challenged: data.data.challenged,
        });
        this.slots[9 - this.initiative_slot].contains_me = data.data.contains_me;
        this.render();
    }

    /**
     * Notify users of the GM clicking the initiative forward button
     * @param context
     * @private
     */
    initial_initiative_next(context) {
        paranoia_log("Got initiative progress click from GM");
        if (this.initiative_slot >= 0) {
            let data = {
                type: "initiative",
                subtype: "initiative_forward",
                data: {},
            };
            this.handle_initiative_next(data);
            game.socket.emit("system.paranoia2017", data);
        }
    }

    /**
     * Handle the GM clicking the initiative forward button
     * @param data
     * @private
     */
    handle_initiative_next(data) {
        paranoia_log("Got initiative progress event");
        this.slots.push({
            actors: [],
            contains_me: false,
        });
        this.initiative_slot--;
        this.render();
    }

    /**
     * Handle our own card selecting, emitting an event to notify others that it happened
     * @param context
     * @private
     */
    handle_my_card_selection(context) {
        paranoia_log("I selected a card");
        // update the local record
        let card_name = context.target.selectedOptions[0].text;
        let card_id = context.target.value;
        let card_action_order = parseInt($(context.target.selectedOptions[0]).attr('data-action-order'));
        this.selected_cards[game.user.character.id] = {
            name: game.user.name,
            is_selected: true,
            selected_card: {
                name: card_name,
                id: card_id,
                action_order: card_action_order,
            },
            is_me: true,
        };
        let data = {
            type: "initiative",
            subtype: "player_card_selection",
            data: {
                player_id: game.user.character.id,
                card_id: card_id,
                card_name: card_name,
                card_action_order: card_action_order,
            }

        };
        // update remote records
        game.socket.emit("system.paranoia2017", data);
    }

    /**
     * Handle someone else selecting a card
     * @param data
     * @private
     */
    handle_foreign_card_selection(data) {
        paranoia_log("Got someone else selecting a card");
        this.selected_cards[data.data.player_id]["is_selected"] = true;
        this.selected_cards[data.data.player_id]["selected_card"]["id"] = data.data.card_id;
        if (game.user.isGM) {
            paranoia_log(data);
            this.selected_cards[data.data.player_id]["selected_card"]["name"] = data.data.card_name;
        } else {
            this.selected_cards[data.data.player_id]["selected_card"]["name"] = "(selected)";
        }
    }

    async _updateObject(event, formData) {
        paranoia_log("_updateobject")
    }

    /**
     * Get a list of characters in the combat who has an associated active user
     * @returns [] - array of actor IDs in the combat with active user owners
     */
    get_combatants() {
        let active_characters = []; // users here must have an assigned character
        let my_character_id = game.user?.character?.id;
        game.users.filter(i => i.active).forEach(function (user) {
            if (!user.isGM) { // exclude GMs from this list as they don't actually select cards
                active_characters.push(user.character.id);
            }
        });

        let combatants = [];
        let combats = game.combats.filter(i => i.active);
        for (let x = 0; x < combats.length; x++) {
            let cur_combat = combats[x];
            let combants = cur_combat.combatants.map(i => i);
            for (let k = 0; k < combants.length; k++) {
                let combatant = combants[k];
                console.log(combatant)
                if (active_characters.includes(combatant.actorId)) {
                    let owner = this.get_combatant_owner(combatant);
                    console.log(`found owner: ${owner}`)
                    combatants.push({
                        user_name: owner.name,
                        user_id: owner.id,
                        actor_id: combatant.actorId,
                        is_me: owner.id === game.user.id,
                    });
                }
            }
        }
        paranoia_log("Found the following combatants");
        paranoia_log(combatants);
        return combatants;
    }

    get_combatant_owner(combatant) {
        paranoia_log(`looking for owner for ${combatant.name}`);
        let owners = Object.keys(combatant.actor.ownership);
        let final_owner = false;
        owners.forEach(function (owner) {
            let ownership_status = combatant.actor.ownership[owner];
            if (ownership_status === 3 && !game.users.get(owner).isGM) {
                // we have found the owner
                paranoia_log(`found owner: ${game.users.get(owner).name}`);
                final_owner = game.users.get(owner);
            }
        });
        return final_owner;
    }
}

/**
 * Used to determine if the current user is a part of the combat (in order to stop showing the initiative manager)
 * @returns {boolean} - true if the current user owns an actor in an active combat, otherwise false
 */
export function am_in_combat() {
    paranoia_log("Checking if I am in combat");
    if (game.user.isGM) {
        paranoia_log("Returning true as I am a GM");
        return true;
    }
    let combats = game.combats.filter(i => i.active);
    for (let x = 0; x < combats.length; x++) {
        let cur_combat = combats[x];
        let combatants = cur_combat.combatants.map(i => i);
        for (let k = 0; k < combatants.length; k++) {
            let combatant = combatants[k];
            console.log(combatant)
            if (combatant.isOwner) {
                paranoia_log("I am in combat");
                return true;
            }
        }
    }
    paranoia_log("I am not in combat");
    return false;
}
