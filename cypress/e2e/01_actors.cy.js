describe("paranoia actors", () => {
    before(() => {
        //cy.setup();
        cy.join();
        cy.wait_until_ready();
        // create a folder for our actors
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('#actors > .directory-header > .header-actions > .create-folder').should('be.visible').then(() => {
            if (Cypress.$('.folder-header > .noborder').length === 0) {
                cy.get('#actors > .directory-header > .header-actions > .create-folder').click();
                cy.get('#folder-create > .window-header > .window-title').should('be.visible');
                cy.get(':nth-child(3) > .form-fields > input').should('be.enabled');
                cy.get('form > button').should('be.enabled');
                cy.get(':nth-child(3) > .form-fields > input').type('tests');
                cy.get('form > button').click();
            }
        });

        // end create a folder for our actors
    });
    beforeEach(() => {
        cy.join();
        cy.wait_until_ready();
        cy.clear_chat();
    });

    after(() => {
        /*
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('.folder-header > .noborder').should('be.visible');

        cy.get('.folder-header > .noborder').rightclick();
        cy.get('.context-items > :nth-child(4)').click();
        cy.get('.yes').should('be.visible').and('be.enabled');
        cy.get('.yes').click();

         */
        //cy.clear_chat();
    });

    /*
    it("creates an NPC", () => {
        // create the NPC
        cy.log("Initialization complete");
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('.folder-header > .create-entry > .fa-user').click();
        cy.get('.form-fields > input').should('be.visible').and('be.enabled');
        cy.get(':nth-child(2) > .form-fields > select').select('npc');
        cy.get('.form-fields > input').type('NPC');
        cy.get('.dialog-button').click();
        cy.get('.form-fields > input').should('not.be.visible');
        // okay, confirm default values
        cy.get('.npc_name_container > .npc_name_input').should('be.visible').and('have.value', 'NPC');
        cy.get('.npc_health_input').should('have.value', 0);
        cy.get(':nth-child(2) > .core_information_details-content > .npc_name_input').should('be.visible').and('have.value', '0');
        // okay, now start editing
        // TODO: I can't figure out how to get testing the TinyMCE editor to work. for now, I'm skipping it.
        cy.get('.npc_health_input').select(4);
        cy.get('.npc_health_input').should('have.value', 4);
    });
    */

    /*
    it("creates a troubleshooter", () => {
        // create the troubleshooter
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('.folder-header > .create-entry > .fa-user').click();
        cy.get('.form-fields > input').should('be.visible').and('be.enabled');
        cy.get(':nth-child(2) > .form-fields > select').select('troubleshooter');
        cy.get('.form-fields > input').type('trouble');
        cy.get('.dialog-button').click();
        cy.get('.form-fields > input').should('not.be.visible');

        // okay, confirm default values
        cy.get(':nth-child(1) > :nth-child(1) > .core_information_details-content > .troubleshooter_input').should('be.visible').and('have.value', 'trouble');
        cy.get('.security_level').should('be.visible').and('have.value', 'red');
        cy.get(':nth-child(3) > .core_information_details-content > .troubleshooter_input').should('be.visible').and('have.value', '');
        cy.get('[name="system.clone_number"]').should('be.visible').and('have.value', 1);
        cy.get('[name="system.clone_max"]').should('be.visible').and('have.value', 6);
        cy.get('[name="system.gender"]').should('be.visible').and('have.value', '');
        cy.get('[name="system.personality"]').should('be.visible').and('have.value', '');
        cy.get('[name="system.treason_stars.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.xp_points.value"]').should('be.visible').and('have.value', 0);
        // stats
        cy.get('[name="system.stats.violence.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.stats.brains.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.stats.chutzpah.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.stats.mechanics.value"]').should('be.visible').and('have.value', 0);
        // skills
        cy.get('[name="system.skills.guns.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.throw.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.melee.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.throw.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.science.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.psychology.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.bureaucracy.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.alpha_complex.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.bluff.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.charm.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.intimidate.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.stealth.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.operate.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.engineer.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.program.value"]').should('be.visible').and('have.value', 0);
        cy.get('[name="system.skills.demolitions.value"]').should('be.visible').and('have.value', 0);
        cy.get('[data-edit="system.memory.value"]').scrollIntoView();
        cy.get('[name="system.moxie.value"]').should('be.visible').and('have.value', 8);
        cy.get('[name="system.moxie.current_max"]').should('be.visible').and('have.value', 8);
        cy.get('[name="system.wounds.value"]').should('be.visible').and('have.value', 0);
        // items headers should not be visible
        cy.get('.troubleshooter_items > :nth-child(3) > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        cy.get('.background > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        // swap to items tab
        cy.get('.sheet-tabs > [data-tab="items"]').click();
        // confirm headers are visible
        cy.get('.troubleshooter_items > :nth-child(3) > .troubleshooter_section > .troubleshooter_section_name > b').should('be.visible');
        cy.get('.description > :nth-child(1) > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        cy.get('.background > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        // swap to background tab
        cy.get('.sheet-tabs > [data-tab="background"]').click();
        cy.get('.troubleshooter_items > :nth-child(3) > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        cy.get('.description > :nth-child(1) > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        cy.get('.background > .troubleshooter_section > .troubleshooter_section_name > b').should('be.visible');
        // swap back to the overview tab
        cy.get('.sheet-tabs > [data-tab="description"]').click();
        cy.get('.troubleshooter_items > :nth-child(3) > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
        cy.get('.description > :nth-child(1) > .troubleshooter_section > .troubleshooter_section_name > b').should('be.visible');
        cy.get('.background > .troubleshooter_section > .troubleshooter_section_name > b').should('not.be.visible');
    });
    */

    /*
    it("tests making a basic skill check", () => {
        // create the troubleshooter
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('.folder-header > .create-entry > .fa-user').click();
        cy.get('.form-fields > input').should('be.visible').and('be.enabled');
        cy.get(':nth-child(2) > .form-fields > select').select('troubleshooter');
        cy.get('.form-fields > input').type('basic skill check');
        cy.get('.dialog-button').click();
        cy.get('.form-fields > input').should('not.be.visible');
        cy.get('.fa-comments').click();

        // test a default skill check
        cy.get(':nth-child(5) > .skill_information_details-label > .skill').should('be.visible'); // guns
        cy.get(':nth-child(5) > .skill_information_details-label > .skill').click();                      // guns
        cy.get('.attr_selection').should('be.visible').and('have.value', 0);
        cy.get('.attr_selection').find(':selected').should('contain.text', 'violence');
        cy.get('.skill_selection').should('be.visible').and('have.value', 0);
        cy.get('.skill_selection').find(':selected').should('contain.text', 'guns');
        cy.get('.node_value').should('be.visible').and('have.value', 0);
        cy.get('[name="computer"]').should('be.visible').and('have.value', 1);
        cy.get('.paranoia_roller_window > button').click();
        cy.get('.paranoia_roller_window > button').should('not.be.visible');
        cy.get('.chat-message').should('be.visible');
        cy.get('.dice-formula').should('be.visible').and('contain.text', 'violence').and('contain.text', 'guns').and('contain.text', 'NODE: 0');
        cy.get('.reroll').should('be.visible').and('be.enabled');
        cy.get('.dice-tooltip').should('not.be.visible');
        cy.get('.dice-formula').click();
        cy.get('.dice-tooltip.expanded').should('be.visible').and('contain.text', 'Skill').and('contain.text', 'Computer');
    });
    */

    it("tests making a positive-NODE skill check", () => {
        // create the troubleshooter
        cy.get('[data-tab="actors"] > .fas').click();
        cy.get('.folder-header > .create-entry > .fa-user').click();
        cy.get('.form-fields > input').should('be.visible').and('be.enabled');
        cy.get(':nth-child(2) > .form-fields > select').select('troubleshooter');
        cy.get('.form-fields > input').type('positive NODE skill check');
        cy.get('.dialog-button').click();
        cy.get('.form-fields > input').should('not.be.visible');
        cy.get('.fa-comments').click();

        // test a default skill check
        cy.get(".window-app.paranoia").should("exist").and("be.visible");
        cy.get('.window-app.paranoia').trigger('mouseenter');
        cy.get('.window-app.paranoia').trigger('mouseover');
        cy.get('[data-edit="system.memory.value"]').scrollIntoView();
        cy.get('[name="system.stats.violence.value"]').type('3');
        cy.get('[name="system.stats.violence.value"]').should('have.value', 3);
        //cy.get(':nth-child(4) > .development_information > :nth-child(1) > .development_information_details-content > input').type('{del}3');
        cy.get(':nth-child(5) > .skill_information_details-label > .skill').should('be.visible'); // guns
        cy.get(':nth-child(5) > .skill_information_details-label > .skill').click();                      // guns
        cy.get('.attr_selection').should('be.visible').and('have.value', 0);
        cy.get('.attr_selection').find(':selected').should('contain.text', 'violence');
        cy.get('.skill_selection').should('be.visible').and('have.value', 0);
        cy.get('.skill_selection').find(':selected').should('contain.text', 'guns');
        cy.get('.node_value').should('be.visible').and('have.value', 0);
        cy.get('[name="computer"]').should('be.visible').and('have.value', 1);
        /*
        cy.get('.paranoia_roller_window > button').click();
        cy.get('.paranoia_roller_window > button').should('not.be.visible');
        cy.get('.chat-message').should('be.visible');
        cy.get('.dice-formula').should('be.visible').and('contain.text', 'violence').and('contain.text', 'guns').and('contain.text', 'NODE: 0');
        cy.get('.reroll').should('be.visible').and('be.enabled');
        cy.get('.dice-tooltip').should('not.be.visible');
        cy.get('.dice-formula').click();
        cy.get('.dice-tooltip.expanded').should('be.visible').and('contain.text', 'Skill').and('contain.text', 'Computer');

         */
    });
});
