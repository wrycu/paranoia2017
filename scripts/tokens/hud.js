export class token_HUD {
    static async add_hud(token) {
        // create the container
        let tooltip =  $(`<div class="paranoia-tooltip-container ${token.id}"></div>`);
        // populate data
        let data = {
            name: token.name || "<COULD NOT LOCATE IDENTITY RECORD>",
            xp: token?.actor?.system?.xp_points?.value || Math.floor(Math.random() * 999),
            treason_stars: token?.actor?.system?.treason_stars?.value || Math.floor(Math.random() * 5),
            dead_zone: game.settings.get("paranoia", "wifi_dead_zone"),
        };
        // render the data into an HTML object for insertion
        let rendered_data = await renderTemplate(
            "systems/paranoia/templates/actors/hud.html",
            data,
        )

        // figure out the position for the tooltip
        let token_wt = token.worldTransform;
        let padding = 5;
        let position = {
            zIndex: Math.max(token.zIndex, 0),
            color: "#000000",
            top: token_wt.ty + (token.h *  token_wt.a) + padding,
            left: token_wt.tx - padding,
        };

        tooltip.html(rendered_data);
        tooltip.css(position);

        // insert the resulting data into the canvas
        $('body.game').append(tooltip);
        return tooltip;
    }

    static async remove_hud(token) {
        let tooltip = $(".paranoia-tooltip-container");
        tooltip.remove(`.${token.id}`);
    }
}
