import {card_discarder} from "./card_discarder.js";
import mutant_power_use from "../items/mutant_power_popup.js";

export class initiative_manager extends FormApplication {
    constructor(object, options) {
        super(object, options)
        this.selected_cards = {};
        this.initiative_slot = 10;
        this.gone_this_round = false;
        this.challenged_this_round = false;
        this.setup_socket();
        this.setup_initiative();

    }


    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/paranoia/templates/combat/initiative_manager.html"
        });
    }

    setup_socket() {
        game.socket.on("system.paranoia", (data) => {
            console.log("got event in window ;)")
            console.log(data)
            if (data.type === "initiative") {
                if (data.subtype === "player_card_selection") {
                    console.log("got remote card selection")
                    this._handle_foreign_card_selection(data);
                } else if (data.subtype === "player_initiative_select") {
                    console.log("got remote initiative select")
                    this._handle_initiative_select(data);
                } else if (data.subtype === "initiative_forward") {
                    console.log("got remote initiative next")
                    this._handle_initiative_next(data);
                } else if (data.subtype === "challenge_start") {
                    console.log("got remote challenge start")
                    this._challenge(data);
                } else if (data.subtype === "challenge_loss") {
                    console.log("got remote challenge loss")
                    this._challenge_wrong(data);
                } else if (data.subtype === "stage_transition") {
                    console.log("changing stage")
                    this._stage_transition(data);
                }
            }
            this.render(true);
        });
    }

    setup_initiative() {
        console.log("in setup")
        this.selected_cards = 1
        this.initiative_slot = 10;
        this.gone_this_round = false;
        this.challenged_this_round = false;
        // can't access "this" in the foreach
        let selected_cards = {}
        game.users.filter(i => i.active).forEach(function (user) {
            if (!user.isGM) {
                selected_cards[user.character.id] = {
                    name: user.name,
                    is_selected: false,
                    selected_card: {
                        name: null,
                        id: null,
                        action_order: null,
                    },
                    is_me: user.character.id === game.user.character.id,
                };
            }
        });
        this.selected_cards = selected_cards;
        this.slots = [];
        this.stage = "stage_1";
    }

    async getData(options = {}) {
        let data = await super.getData();
        console.log("getData")
        console.log(data)
        data.is_gm = game.user.isGM;
        data.users = game.users.filter(i => i.active).map(i => i.name);
        data.my_id = game.user.character.id;
        data.selected_cards = this.selected_cards;
        data.selection_disabled = false;
        data.available_cards = [];
        game.user.character.items.filter(i => ["action_card", "equipment_card", "mutant_power_card"].includes(i.type));
        let actor = game.user.character.system;
        let items = game.user.character.items.filter(i => ["action_card", "equipment_card", "mutant_power_card"].includes(i.type));
        if (items.length > 0) {
            for (let item of items) {
                // derived values on items are not calculated when accessing outside a sheet
                if (item.type === "equipment_card") {
                    item.system.action_order = actor.stats[item.system.skill.name].value + parseInt(item.system.skill.bonus);
                }
                const item_details = item.get_item_details();
                const template = "systems/paranoia/templates/chat/item.html";
                item.html = await renderTemplate(template, {item_details, item});
                data.available_cards.push(item);
            }
        }
        data.initiative_slot = this.initiative_slot;
        data.slots = this.slots;
        data.gone_this_round = this.gone_this_round;
        data.challenged_this_round = this.challenged_this_round;
        data.stage = this.stage;
        console.log(data)
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        console.log("activating listeners")

        // TODO: refactor to use initial / real handlers
        html.find(".progress_combat").click(this.initial_stage_transition.bind(this));
        html.find(".card_selection").on("change", this._handle_my_card_selection.bind(this));
        html.find(".initiative_next").click(this._initial_initiative_next.bind(this));
        html.find(".initiative_select").click(this._handle_initial_initiative_select.bind(this));
        html.find(".challenge_initiative").click(this._initial_challenge.bind(this));
    }

    initial_stage_transition(context) {
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

        game.socket.emit("system.paranoia", data);
        this._stage_transition(data);
    }

    _stage_transition(data) {
        this.stage = data.data.new_stage;
        if (this.stage === "stage_1") {
            this.setup_initiative();
        }
        this.render(true);
    }

    async _initial_challenge(context) {
        console.log("got local challenge")
        let challenged_player = $(context.target).attr("data-player-id");
        let challenged_index = parseInt($(context.target).attr("data-slot"));
        console.log(challenged_player)
        console.log(challenged_index)
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
            "systems/paranoia/templates/combat/initiative_challenge_start.html",
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

        this._challenge(data);
        game.socket.emit("system.paranoia", data);
    }

    _challenge(data) {
        console.log("got challenge notification")
        console.log(data)
        if (data.data.challenged_id === game.user.character.id) {
            // I am the one who was challenged; perform specific steps
            console.log("I was challenged")
            // determine: was I lying about the initiative?
            // value I'm supposed to have
            let target_value = 10 - data.data.challenged_index;
            let actual_value = parseInt($(".card_selection option:selected").attr("data-action-order"));
            console.log(`challenged in spot ${target_value}, real value ${actual_value}`)
            if (target_value !== actual_value && actual_value < target_value) {
                this.challenge_lied(data.data.challenger_id);
            } else {
                this.challenge_truth(data.data.challenger_id);
            }
            // if I was, go down challenge_lie
            // if I wasn't, go down challenge_win
        } else {
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
        this.render(true);
    }

    async challenge_lied(challenger_id) {
        console.log("I lost the challenge")
        // TODO: insert the challenger in the initiative
        const html = await renderTemplate(
            "systems/paranoia/templates/combat/initiative_challenge_correct.html",
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

        this.discard_card(game.user.character.id, $(".card_selection").val());
    }

    challenge_truth(challenger_id) {
        console.log("I won the challenge")
        let data = {
            type: "initiative",
            subtype: "challenge_loss",
            data: {
                challenger_id: challenger_id,
            }
        };
        console.log(data)
        // TODO: send "player Y was not lying about initiative, player X is discarding a card" message
        game.socket.emit("system.paranoia", data);
    }

    async _challenge_wrong(data) {
        console.log("got challenge wrong")
        console.log(data)
        if (data.data.challenger_id === game.user.character.id) {
            console.log("I was the challenger")
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
                "systems/paranoia/templates/combat/initiative_challenge_incorrect.html",
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
        if (actor.items.get(card_id)?.type !== "mutant_power_card") {
            // TODO: this is an async call which we are not awaiting. do we care?
            actor.deleteEmbeddedDocuments("Item", [card_id]);
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
    _handle_initial_initiative_select(context) {
        console.log("selected initiative")
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
        game.socket.emit("system.paranoia", data);
        // update value for local usage
        data.data.contains_me = true;
        this._handle_initiative_select(data);
        // local only update
        this.gone_this_round = true;
    }

    _handle_initiative_select(data) {
        // index is forward but countdown is backwards
        this.slots[9 - this.initiative_slot].actors.push({
            player_id: data.data.player_id,
            player_name: data.data.player_name,
            challenged: data.data.challenged,
        });
        this.slots[9 - this.initiative_slot].contains_me = data.data.contains_me;
        this.render(true);
    }

    _initial_initiative_next(context) {
        console.log("initial initiative next")
        console.log(context)
        console.log(this)
        if (this.initiative_slot >= 0) {
            let data = {
                type: "initiative",
                subtype: "initiative_forward",
                data: {},
            };
            this._handle_initiative_next(data);
            game.socket.emit("system.paranoia", data);
            console.log("emitting event")
        }
    }

    _handle_initiative_next(data) {
        console.log("got initiative next")
        this.slots.push({
            actors: [],
            contains_me: false,
        });
        this.initiative_slot--;
        this.render(true);
    }

    _handle_my_card_selection(context) {
        console.log("got card selection")
        console.log(context)
        // update the local record
        let card_name = context.target.selectedOptions[0].text;
        let card_id = context.target.value;
        let card_action_order = $(context).attr("data-action-order");
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
        game.socket.emit("system.paranoia", data);
    }

    _handle_foreign_card_selection(data) {
        this.selected_cards[data.data.player_id]["is_selected"] = true;
        this.selected_cards[data.data.player_id]["selected_card"]["id"] = data.data.card_id;
        if (game.user.isGM) {
            this.selected_cards[data.data.player_id]["selected_card"]["name"] = data.data.card_name;
        } else {
            this.selected_cards[data.data.player_id]["selected_card"]["name"] = "(selected)";
        }
    }

    async _updateObject(event, formData) {
        console.log("_updateobject")
    }
}
