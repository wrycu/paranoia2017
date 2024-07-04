import {computer_die} from "./dice.js";

export class roll_paranoia extends Roll {
    constructor(...args) {
        super(...args);
    }

    static CHAT_TEMPLATE = "systems/paranoia2017/templates/dice/computer_roll.html";

    static TOOLTIP_TEMPLATE = "systems/paranoia2017/templates/dice/tooltip.html";

    evaluateSync({minimize = false, maximize = false, async} = {}) {
        return super.evaluateSync({minimize, maximize, async});
    }

    async get_roll_data() {
        if (!this._evaluated) await this.roll();
        let evaluated = {
            successes: 0,
            computer: false,
            contains_paranoia_dice: false,
            results: [],
            pretty: [],
        }

        this.dice.forEach(function (die_type) {
            die_type.results.forEach(function (result) {
                evaluated.results.push(result.result);
                if (die_type.constructor.name === 'node_die') {
                    evaluated.contains_paranoia_dice = true;
                    if ([5, 6].includes(result.result)) {
                        evaluated.successes++;
                        evaluated.pretty.push({
                            'type': 'node',
                            'class': 'success',
                            'result': result.result,
                        });
                    } else {
                        evaluated.pretty.push({
                            'type': 'node',
                            'class': 'failure',
                            'result': result.result,
                        });
                    }
                } else if (die_type.constructor.name === 'mutant_die') {
                    evaluated.contains_paranoia_dice = true;
                    // TODO: what is this for? anything?
                } else if (die_type.constructor.name === 'negative_node_die') {
                    evaluated.contains_paranoia_dice = true;
                    if ([5, 6].includes(result.result)) {
                        evaluated.successes++;
                        evaluated.pretty.push({
                            'type': 'negative_node',
                            'class': 'success',
                            'result': result.result,
                        });
                    } else {
                        evaluated.successes--;
                        evaluated.pretty.push({
                            'type': 'negative_node',
                            'class': 'failure',
                            'result': result.result,
                        });
                    }
                } else if (die_type.constructor.name === 'computer_die') {
                    evaluated.contains_paranoia_dice = true;
                    if (result.result === 6) {
                        evaluated.computer = true;
                        evaluated.pretty.push({
                            'type': 'computer',
                            'class': 'result',
                            'result': result.result,
                        });
                    } else {
                        evaluated.pretty.push({
                            'type': 'computer',
                            'class': 'blank',
                            'result': result.result,
                        });
                    }
                }
            });
        });
        return evaluated;
    }
}
