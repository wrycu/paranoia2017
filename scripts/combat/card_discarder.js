export function card_discarder(actor_id, card_id) {
    let actor = game.actors.get(actor_id);
    // TODO: this is an async call which we are not awaiting. do we care?
    actor.deleteEmbeddedDocuments("Item", [card_id]);
    // TODO: chat message
    return true;
}
