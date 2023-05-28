export class initiative_manager extends FormApplication {
    constructor(object, options) {
        super(object, options)
        this.extra_data = "no extra data";
        this.selected_cards = {};
        this.initiative_slot = 10;
        this.setup_initiative();
    }


    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/paranoia/templates/combat/initiative_manager.html"
        });
    }

    setup_initiative() {
        console.log("in setup")
        this.selected_cards = 1
        this.initiative_slot = 10;
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
    }

    async getData(options = {}) {
        let data = await super.getData();
        console.log("getData")
        console.log(data)
        data.extra_data = this.extra_data
        data.is_gm = game.user.isGM;
        data.users = game.users.filter(i => i.active).map(i => i.name);
        data.me = game.user.id;
        data.selected_cards = this.selected_cards;
        data.selection_disabled = false;
        data.available_cards = game.user.character.items.filter(i => i.type === "action_card");
        data.initiative_slot = this.initiative_slot;
        console.log(data)
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        console.log("activating listeners")
        game.socket.on("system.paranoia", (data) => {
            console.log("got event in window ;)")
            console.log(data)
            this.extra_data = "hello world"
            this.render(true)
            console.log(data)
            if (data.type === "initiative") {
                if (data.subtype === "player_card_selection") {
                    console.log("got remote card selection")
                    this._handle_foreign_card_selection(data);
                }
            }
        });

        html.find(".card_selection").on("change", this._handle_my_card_selection.bind(this));
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
