export async function initiative_start(combat_info, round_info, time_info=null) {
    console.log("initiative_start");
    console.log(combat_info)
    console.log(round_info)
    console.log(time_info)
    request_pick_card();

    if (time_info) {
        return {combat_info, round_info, time_info};
    } else {
        return {combat_info, round_info};
    }
}

export async function initiative_stop(combat_info, round_info, time_info=null) {
    console.log("initiative stop")
    if (time_info) {
        return {combat_info, round_info, time_info};
    } else {
        return {combat_info, round_info};
    }
}

function request_pick_card() {
    let data = {
        type: "initiative",
        sub_type: "start_request_card_pick",
    };
    game.socket.emit("system.paranoia", data);
    console.log("emit")
    //game.socket.emit("system.paranoia", {});
}
