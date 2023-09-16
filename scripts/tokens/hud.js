export class token_HUD {
    static async add_hud(token) {
        // create the container
        let tooltip = $(`<div class="paranoia-tooltip-container ${token.id}"></div>`);
        let xp = Math.floor(Math.random() * 999);
        if (token?.actor?.system?.xp_points?.value !== -1) {
            // -1 can be used as a placeholder value by the GM
            xp = token?.actor?.system?.xp_points?.value;
        }
        let treason_stars = Math.floor(Math.random() * 5);
        if (token?.actor?.system?.treason_stars?.value !== -1) {
            // -1 can be used as a placeholder value by the GM
            treason_stars = token?.actor?.system?.treason_stars?.value;
        }
        // populate data
        let name;
        try {
            if (token.actor.type === "troubleshooter") {
                name = `${token.actor.name.toUpperCase()}-${token.actor.system.security_clearance.substring(0, 1).toUpperCase()}-${token.actor.system.home_sector.toUpperCase()}-${token.actor.system.clone_number}`;
            } else {
                name = token.name;
            }
        } catch (error) {
            name = "<COULD NOT LOCATE IDENTITY RECORD>";
        }

        let data = {
            name: name,
            xp: xp,
            treason_stars: treason_stars,
            dead_zone: game.settings.get("paranoia", "wifi_dead_zone"),
        };
        // render the data into an HTML object for insertion
        let rendered_data = await renderTemplate(
            "systems/paranoia2017/templates/actors/hud.html",
            data,
        )

        // figure out the position for the tooltip
        let token_wt = token.worldTransform;
        let padding = 5;
        let position = {
            zIndex: Math.max(token.zIndex, 0),
            color: "#000000",
            top: token_wt.ty + (token.h * token_wt.a) + padding,
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
