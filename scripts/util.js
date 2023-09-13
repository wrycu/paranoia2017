export function paranoia_log(message) {
    if (game.settings.get("paranoia", "debug_logging")) {
        console.log(message);
    }
}
