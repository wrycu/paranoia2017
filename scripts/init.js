import {paranoia_log} from "./util.js";

/**
 * Registers a scene control button under "Token Controls" to toggle the Wifi Deadzone setting
 * @param buttons
 * @returns {*}
 */
export function register_wifi_dead_zone(buttons) {
    paranoia_log("Registering Wifi Deadzone toggle");
    buttons[0]['tools'].push({
        name: 'wifi',
        title: 'Toggle Wifi Deadzone',
        icon: 'fa fa-wifi',
        button: true,
        onClick: () => {
            toggle_wifi();
        },
    });
    console.log(buttons)
    return buttons
    //return [controls, html, context];
}

/**
 * Actually toggle the setting for Wifi Deadzone
 * This makes it so mousing over a token renders question marks instead of the name, XP points, and treason stars
 */
export function toggle_wifi() {
    paranoia_log("Toggling Wifi Deadzone setting");
    game.settings.set(
        "paranoia2017",
        "wifi_dead_zone",
        !game.settings.get("paranoia2017", "wifi_dead_zone"),
    );
}
