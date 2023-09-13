import {initiative_manager, am_in_combat} from "./combat/initiative_manager.js";

export async function socket_listener(data) {
    console.log("got data from socket")
    console.log(data)
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
