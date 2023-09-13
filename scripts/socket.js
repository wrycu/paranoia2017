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
            let update_form = new initiative_manager(
                {},
                {
                    width: "500",
                    height: "auto",
                    resizable: true,
                    title: "Initiative Manager",
                }
            );
            await update_form.render(true);
        }
    }
}
