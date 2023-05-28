import {initiative_manager} from "./combat/initiative_manager.js";

export async function socket_listener(data) {
    console.log("got data from socket")
    console.log(data)
    if (data.type === "temp" && data.subtype === "open_manager") {
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
