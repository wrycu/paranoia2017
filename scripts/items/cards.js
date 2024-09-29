import {paranoia_log} from "../util.js";

/**
 * Creates all the decks, hands, and piles used to track cards
 * It then populates those with one copy of every item
 * NOTE that some cards share names and won't get >1 copy added in this way
 * @returns {Promise<void>}
 */
export async function init_decks() {
    if (!game.user.isGM) {
        return;
    }

    let expected_deck_bases = [
        "Action Card",
        "Mutant Power",
        "Equipment",
        "Secret Society",
        "Bonus Duty",
    ];
    let deck_map = {
        "Action Card": "action_card",
        "Mutant Power": "mutant_power_card",
        "Equipment": "equipment_card",
        "Secret Society": "secret_society_card",
        "Bonus Duty": "bonus_duty_card",
    };

    for (const cur_base of expected_deck_bases) {
        let length;
        let deck_name;
        deck_name = `${cur_base} Deck`;
        length = game.cards.filter(i => i.name === deck_name).length;
        if (length === 0) {
            await Cards.create({
                name: deck_name,
                type: "deck",
                ownership: {
                    default: 3,
                },
            });
        }
        await populate_deck(deck_name, deck_map[cur_base]);

        deck_name = `${cur_base} Held`;
        length = game.cards.filter(i => i.name === deck_name).length;
        if (length === 0) {
            await Cards.create({
                name: deck_name,
                type: "pile",
                ownership: {
                    default: 3,
                },
            });
        }

        deck_name = `${cur_base} Discard`;
        length = game.cards.filter(i => i.name === deck_name).length;
        if (length === 0) {
            await Cards.create({
                name: deck_name,
                type: "hand",
                ownership: {
                    default: 3,
                },
            });
        }
    }
    await trim_decks();
}

/**
 * Add all copies of existing cards to their appropriate deck so they can be drawn
 * @param deck_name - name of the deck to add cards to
 * @param item_type - type of item to look for
 * @returns {Promise<void>}
 */
async function populate_deck(deck_name, item_type) {
    paranoia_log(`Populating ${deck_name} with cards`);
    let deck = game.cards.filter(i => i.name === deck_name)[0];
    for (const card of game.items.filter(i => i.type === item_type)) {
        if (!card.system.exclude_from_deck) {
            let existing_card = deck.cards.filter(i => i.name === card.name);
            if (existing_card.length === 0) {
                // the card is not already added to the appropriate deck, add it
                await add_to_deck(card, deck);
            }
        }
    }
}

async function trim_decks() {
    paranoia_log("Trimming decks");
    let expected_deck_bases = [
        "Action Card",
        "Mutant Power",
        "Equipment",
        "Secret Society",
        "Bonus Duty",
    ];
    for (const cur_base of expected_deck_bases) {
        let deck = game.cards.find(i => i.name === `${cur_base} Deck`);
        let discard_deck = game.cards.find(i => i.name === `${cur_base} Discard`);
        let held_deck = game.cards.find(i => i.name === `${cur_base} Held`);
        for (let x = 0; x < deck.cards.contents.length; x++) {
            let card_data = deck.cards.contents[x];
            if (game.items.filter(i => i.name === card_data.name).length === 0) {
                // the item has been renamed or removed; remove it from the deck
                await remove_from_deck(card_data, deck);
            }
        }
        for (let x = 0; x < discard_deck.cards.contents.length; x++) {
            let card_data = discard_deck.cards.contents[x];
            if (game.items.filter(i => i.name === card_data.name).length === 0) {
                // the item has been renamed or removed; remove it from the deck
                await remove_from_deck(card_data, discard_deck);
            }
        }
        for (let x = 0; x < held_deck.cards.contents.length; x++) {
            let card_data = held_deck.cards.contents[x];
            if (game.items.filter(i => i.name === card_data.name).length === 0) {
                // the item has been renamed or removed; remove it from the deck
                await remove_from_deck(card_data, held_deck);
            }
        }
    }
}

/**
 * Adds a card to all relevant decks
 * @param card_data - item data for the card to be added
 * @returns {Promise<void>}
 */
export async function add_to_decks(card_data) {
    paranoia_log("Adding missing cards to decks");
    let expected_deck_bases = [
        "Action Card",
        "Mutant Power",
        "Equipment",
        "Secret Society",
        "Bonus Duty",
    ];
    let deck_map = {
        "Action Card": "action_card",
        "Mutant Power": "mutant_power_card",
        "Equipment": "equipment_card",
        "Secret Society": "secret_society_card",
        "Bonus Duty": "bonus_duty_card",
    };
    for (const cur_base of expected_deck_bases) {
        if (deck_map[cur_base] === card_data.type) {
            let deck = game.cards.filter(i => i.name === `${cur_base} Deck`)[0];
            paranoia_log(`Found missing card: ${card_data.name}`);
            await add_to_deck(card_data, deck);
        }
    }
}

/**
 * Remove a card from all decks
 * @param card_data - item data for the card to be removed
 * @returns {Promise<void>}
 */
export async function remove_from_decks(card_data) {
    paranoia_log(`Removing ${card_data.name} from all decks`);
    let deck_map = {
        "action_card": "Action Card",
        "equipment_card": "Equipment",
        "mutant_power_card": "Mutant Power",
        "bonus_duty_card": "Bonus Duty",
        "secret_society_card": "Secret Society",
    };
    const card_type = card_data.type;
    let draw_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Deck`);
    let discard_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Discard`);
    let held_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Held`);

    await remove_from_deck(card_data, draw_deck);
    await remove_from_deck(card_data, discard_deck);
    await remove_from_deck(card_data, held_deck);
}

/**
 * Remove a card from a specific deck
 * @param card_data - item data for the card to be removed
 * @param deck - deck from which to remove the card
 * @returns {Promise<void>}
 */
export async function remove_from_deck(card_data, deck) {
    paranoia_log(`Attempting to remove ${card_data.name} from deck`);
    let cards = deck.cards.filter(i => i.name === card_data.name);
    for (let x = 0; x < cards.length; x++) {
        paranoia_log("Found card; deleting");
        await deck.deleteEmbeddedDocuments(
            "Card",
            [cards[x].id],
        );
    }
}

/**
 * Add a card to a specific deck
 * @param card_data - item data for the card to be added
 * @param deck - deck to add the card to
 * @returns {Promise<*>}
 */
export async function add_to_deck(card_data, deck) {
    paranoia_log(`Adding ${card_data.name} to deck`);
    return await deck.createEmbeddedDocuments(
        "Card",
        [{
            name: card_data.name,
            type: "base",
            face: 0,
            faces: [{
                name: card_data.name,
                text: card_data.system.text,
                img: card_data.img,
            }],
        }],
    );
}

export async function deal_card(actor_id, card_data) {
    paranoia_log(`Dealing ${card_data.name}`);
    const card_name = card_data.name;
    const card_type = card_data.type;
    let deck_map = {
        "action_card": "Action Card",
        "equipment_card": "Equipment",
        "mutant_power_card": "Mutant Power",
        "bonus_duty_card": "Bonus Duty",
        "secret_society_card": "Secret Society",
    }
    let draw_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Deck`);
    let discard_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Discard`);
    let held_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Held`);

    let found_card = draw_deck.cards.filter(i => i.name === card_name);
    let found_discard_card = discard_deck.cards.filter(i => i.name === card_name);

    if (found_card.length === 0) {
        found_card = await add_to_deck(card_data, draw_deck);
    } else if (found_card.filter(i => i.drawn === false).length === 0) {
        if (found_discard_card.length === 0) {
            // nothing available in the discard, create it
            found_card = await add_to_deck(card_data, draw_deck);
        } else {
            // shuffle the discard into the deck
            for (const card of discard_deck.cards) {
                await discard_deck.pass(draw_deck, [card.id], {chatNotification: false});
            }
            await draw_deck.shuffle({chatNotification: false});
            found_card = draw_deck.cards.filter(i => i.name === card_name);
        }
    }
    if (found_card.length === 0) {
        ui.notifications.error(`Could not find ${card_name}; bad game state. Please notify your GM.`);
        paranoia_log(`Could not find ${card_name}; bad game state. Please notify your GM.`);
    }
    // at this point the card exists and has not yet been drawn
    // need to draw the specific card
    //await held_deck.draw(draw_deck, 1, {chatNotification: false});
    await draw_deck.pass(held_deck, [found_card[0].id], {chatNotification: false});
}

export class CardManager extends FormApplication {
    constructor(object = {}, options = {}) {
        super(object, options);
        if (options?.menu) {
            this.menu = options.menu;
        }
    }

    close() {
        return;
    }

    /** @override */
    getData() {
        const x = $(window).width();
        const y = $(window).height();
        this.position.left = x - 505;
        this.position.top = y - 80;
        this.width = 2000;
        let is_gm = game.user.isGM;
        return {
            is_gm: is_gm,
        };
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "card_manager",
            classes: ["paranoia"],
            title: "Card Manager",
            template: "systems/paranoia2017/templates/cards/manager.html",
        });
    }

    activateListeners(html) {
        const d = html.find("paranoia_card_manager_container")[0];
        new Draggable(this, html, d, this.options.resizable);

        $("#card_manager").css({bottom: "0px", right: "305px"});
        $(".paranoia .card_manager").click(this._handle_click.bind(this));
    }

    async _handle_click(context) {
        let drawer = new card_draw();
        await drawer.render(true);
    }

    /** @override */
    _updateObject(event, formData) {

    };
}

export class card_draw extends FormApplication {
    constructor(object, options) {
        super(object, options)
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Draw Cards",
            template: "systems/paranoia2017/templates/cards/draw.html"
        });
    }

    async getData(options = {}) {
        let data = await super.getData();
        data['decks'] = {
            "action_card": "Action Card",
            "equipment_card": "Equipment",
            "mutant_power_card": "Mutant Power",
            "bonus_duty_card": "Bonus Duty",
            "secret_society_card": "Secret Society",
        };
        let actors = {};
        let is_gm = game.user.isGM;
        if (is_gm) {
            //actors[game.user.character.id] = game.user.character.name;
            for (const user of game.users.filter(i => !i.isGM && i?.character)) {
                actors[user.character.id] = `${user.character.name} (${user.name})`;
            }
        } else {
            actors[game.user.character.id] = game.user.character.name;
        }
        data['actors'] = actors;
        data['is_gm'] = is_gm;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        if (!Array.isArray(formData['actors'])) {
            formData['actors'] = [formData['actors']];
        }
        for (const cur_actor of formData['actors']) {
            if (!cur_actor) {
                // form submission includes null (unchecked) actors; just skip over them
                continue;
            }
            let drawn = [];
            for (let x = 0; x < formData['draw_amount']; x++) {
                drawn = drawn.concat(await this.draw_card(formData['deck'], cur_actor));
            }
            console.log(drawn)
            this.tattle_draw(game.user.isGM, cur_actor, formData['draw_amount'], formData['deck'], drawn);
        }
    }

    async tattle_draw(is_gm, actor, card_count, card_type, cards_drawn) {
        if (cards_drawn.length === 0) {
            // we didn't actually draw any cards
            return;
        }
        let verb = "paranoia.card_draw.tattle.drawn";
        if (is_gm) {
            verb = "paranoia.card_draw.tattle.dealt";
        }
        let deck_map = {
            "action_card": "Action Card",
            "equipment_card": "Equipment",
            "mutant_power_card": "Mutant Power",
            "bonus_duty_card": "Bonus Duty",
            "secret_society_card": "Secret Society",
        }
        let chat_data;

        chat_data = await renderTemplate(
            "systems/paranoia2017/templates/chat/tattle_draw.html",
            {
                count: card_count,
                type: deck_map[card_type],
                cards_drawn: cards_drawn,
                verb: game.i18n.localize(verb),
            },
        );

        let speaker_user;
        let listener_user;
        if (is_gm) {
            let possible_users = game.users.filter(i => !i.isGM).map(i => i.id);
            let owners = Object.keys(game.actors.get(actor).ownership);
            owners.forEach(function(user) {
                if (game.actors.get(actor).ownership[user] === 3 && possible_users.includes(user)) {
                    listener_user = user;
                }
            });
            speaker_user =  game.users.filter(i => i.isGM && i.active).map(i => i.id)[0];
        } else {
            speaker_user = game.user.id;
            listener_user =  game.users.filter(i => i.isGM && i.active).map(i => i.id)[0];
        }

        if (speaker_user && listener_user) {
            let chat_options = {
                speaker: {
                    actor: actor,
                    user: speaker_user,
                },
                content: chat_data,
                isRoll: true,
                sound: "sounds/dice.wav",
                whisper: listener_user,
            };
            ChatMessage.create(chat_options);
        }
    }

    async draw_card(card_type, actor_id) {
        let deck_map = {
            "action_card": "Action Card",
            "equipment_card": "Equipment",
            "mutant_power_card": "Mutant Power",
            "bonus_duty_card": "Bonus Duty",
            "secret_society_card": "Secret Society",
        }
        let actor = game.actors.get(actor_id);
        let draw_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Deck`);
        let discard_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Discard`);
        let held_deck = game.cards.find(i => i.name === `${deck_map[card_type]} Held`);
        let drawn_cards = [];
        let length = draw_deck.cards.filter(i => !i.drawn).length;
        if (length === 0) {
            // the draw deck is empty, shuffle the discard into it
            for (const card of discard_deck.cards) {
                await discard_deck.pass(draw_deck, [card.id], {chatNotification: false});
            }
            await draw_deck.shuffle({chatNotification: false});
        }
        length = draw_deck.cards.filter(i => !i.drawn).length
        if (length === 0) {
            // we still have zero cards, give a message and abort
            ui.notifications.warn("All cards of the selected type are already held by actors, aborting");
            return [];
        }
        // ok, now draw
        let drawn_card = await held_deck.draw(draw_deck, 1, {chatNotification: false});
        game.socket.emit("system.paranoia2017", {type: "card", subtype: "draw", actor_id: actor_id})

        for (let card of drawn_card) {
            let item = game.items.find(i => i.name === card.name);
            if (!item) {
                console.log(`bad item: ${card.name}`)
                // TODO: this should probably delete the card
            } else {
                console.log("drew card")
                await actor.createEmbeddedDocuments("Item", [item]);
                drawn_cards.push(item.name);
            }
        }
        return drawn_cards;
    }
}
