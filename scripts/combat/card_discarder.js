import {paranoia_log} from "../util.js";

export function card_discarder(actor_id, card_id) {
    paranoia_log(`Discarding card from ${actor_id} / ${card_id}`);
    let actor = game.actors.get(actor_id);
    actor.deleteEmbeddedDocuments("Item", [card_id]);
    return true;
}
