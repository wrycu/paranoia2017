export function paranoia_log(message) {
    if (game.settings.get("paranoia2017", "debug_logging")) {
        console.log(message);
    }
}
