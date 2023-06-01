export default class paranoia_item extends Item {
    get_item_details () {
        console.log("got details")
        console.log(this)
        let data = {
            name: this.name,
            img: this.img,
            type: this.type,
            action_order: this?.system.action_order,
            reaction: this?.system.reaction,
        };

        if (["action_card", "mutant_power_card", "equipment_card"].includes(this.type)) {
            data.description = this.system.text;
        } else if (this.type === "bonus_duty_card") {
            data.description = this.system.responsibilities;
        }
        return data;
    }
}
