import {initiative_manager, am_in_combat} from "./combat/initiative_manager.js";
import {paranoia_log} from "./util.js";

export async function socket_listener(data) {
    paranoia_log(`Got data from socket: ${data}`);
    if (data.type === "initiative" && (data.subtype === "stage_transition" || data.subtype === "open_manager")) {
        // skip the check if we aren't in the combat
        if (!am_in_combat()) {
            return;
        }
        // check to see if we need to open the initiative manager (when e.g. someone reloads)
        if ($(".initiative_manager").length === 0) {
            // it's not already open, open it
            game.manager = await new initiative_manager(
                {},
                {
                    width: "500",
                    height: "auto",
                    resizable: true,
                    title: "Initiative Manager",
                }
            );
            await game.manager.render(true);
        }
    }
    if (data.type === "initiative") {
        if (!am_in_combat()) {
            paranoia_log("Closing manager since I'm not in combat");
            game.manager.custom_close();
        }
        if (data.subtype === "player_card_selection") {
            paranoia_log("got remote card selection");
            game.manager.handle_foreign_card_selection(data);
        } else if (data.subtype === "player_initiative_select") {
            paranoia_log("got remote initiative select");
            game.manager.handle_initiative_select(data);
        } else if (data.subtype === "initiative_forward") {
            paranoia_log("got remote initiative next");
            game.manager.handle_initiative_next(data);
        } else if (data.subtype === "challenge_start") {
            paranoia_log("got remote challenge start");
            game.manager.challenge(data);
        } else if (data.subtype === "challenge_loss") {
            paranoia_log("got remote challenge loss");
            game.manager.challenge_wrong(data);
        } else if (data.subtype === "stage_transition") {
            paranoia_log("changing stage");
            game.manager.stage_transition(data);
        } else if (data.subtype === "lost_challenge") {
            paranoia_log("caught player losing challenge");
            game.manager.process_lost_challenge(data);
        } else {
            paranoia_log("Ignoring data");
            return;
        }
        game.manager.render();
    }
}
