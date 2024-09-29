export class ToolTipSettings extends FormApplication {
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/paranoia2017/templates/ui/tooltip_settings.html`,
            id: 'tooltip_settings',
            title: 'Set Tooltips',
            resizable: true,
            width: 700,
        });
    }

    async _updateObject(event, formData) {
        const data = expandObject(formData);
        if (!Object.keys(formData).includes('enabled')) {
            // form does not include unchecked inputs
            formData['enabled'] = false;
        }
        let settings = {
            enabled: formData['enabled'],
            stats: {},
            skills: {},
        };
        for (let x = 0; x < CONFIG.paranoia.stats.length; x++) {
            let stat = CONFIG.paranoia.stats[x];
            settings['stats'][stat] = formData[stat];
        }
        for (let x = 0; x < CONFIG.paranoia.stats.length; x++) {
            let stat = CONFIG.paranoia.stats[x];
            settings['stats'][stat] = formData[stat];
        }
        for (let x = 0; x < CONFIG.paranoia.skills.length; x++) {
            let skill = CONFIG.paranoia.skills[x];
            settings['skills'][skill] = formData[skill];
        }
        game.settings.set('paranoia2017', 'tooltips', settings);
    }

    getData() {
        let data = {
            tooltips: game.settings.get('paranoia2017', 'tooltips'),
        };
        return data;
    }
}
