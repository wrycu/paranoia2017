export async function create_macro(macro) {
    let uuid = macro.command.split("\"");
    if (uuid.length >= 1) {
        const document = await fromUuid(uuid[1]);
        macro.img = document.img;
        await macro.update({img: document.img});
    }
    return macro;
}
