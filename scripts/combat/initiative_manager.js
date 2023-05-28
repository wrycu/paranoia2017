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
        });
        this.selected_cards = selected_cards;
        this.slots = [];
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
        data.available_cards = game.user.character.items.filter(i => i.type === "action_card");
        data.initiative_slot = this.initiative_slot;
        data.slots = this.slots;
        data.gone_this_round = this.gone_this_round;
        data.challenged_this_round = this.challenged_this_round;
        console.log(data)
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        console.log("activating listeners")

        // TODO: refactor to use initial / real handlers
        html.find(".card_selection").on("change", this._handle_my_card_selection.bind(this));
        html.find(".initiative_next").click(this._initial_initiative_next.bind(this));
        html.find(".initiative_select").click(this._handle_initial_initiative_select.bind(this));
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
        let data = {
            type: "initiative",
            subtype: "initiative_forward",
            data: {},
        };
        this._handle_initiative_next(data);
        game.socket.emit("system.paranoia", data);
        console.log("emitting event")
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
