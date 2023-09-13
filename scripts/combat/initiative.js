import {paranoia_log} from "../util.js";

export async function initiative_start(combat_info, round_info, time_info=null) {
    paranoia_log("Caught combat start!");
    request_pick_card();

    if (time_info) {
        return {combat_info, round_info, time_info};
    } else {
        return {combat_info, round_info};
    }
}

export async function initiative_stop(combat_info, round_info, time_info=null) {
    paranoia_log("emit initiative_stop");
    if (time_info) {
        return {combat_info, round_info, time_info};
    } else {
        return {combat_info, round_info};
    }
}

function request_pick_card() {
    paranoia_log("emit start_request_card_pick");
    let data = {
        type: "initiative",
        sub_type: "start_request_card_pick",
    };
    game.socket.emit("system.paranoia", data);
}
