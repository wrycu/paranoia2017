/**
 * Visits document root and accepts the license if redirected to the accept
 * license page.
 */
function accept_license() {
    cy.visit("/");
    cy.url().then((url) => {
        if (url !== `${Cypress.config("baseUrl")}/license`) {
            return;
        }
        cy.get("#eula-agree").check();
        cy.get("#sign").click();
    });
}

/**
 * Visits document root and authenticates as an admin if redirected.
 */
function auth_as_admin() {
    cy.visit("/");
    cy.url().then((url) => {
        if (url !== `${Cypress.config("baseUrl")}/auth`) {
            return;
        }
        cy.get("#key").type("test-admin-key{enter}");
    });
}

/**
 * Handles setup of the system, modules, and world.
 */
function setup() {
    accept_license();
    auth_as_admin();

    cy.visit("/");
    cy.url().then((url) => {
        if (url !== `${Cypress.config("baseUrl")}/setup`) {
            return;
        }

        cy.get('.sheet-tabs > [data-tab="systems"]').click();
        cy.get("#system-list").then(($systemList) => {
            // System already installed
            if ($systemList.find('[data-package-id="starwarsffg"]').length) {
                return;
            }

            cy.get(".active > .setup-footer > .install-package").click();

            cy.get('[data-package-id="starwarsffg"] > .package-controls > .install').click();

            cy.get("#notifications > .notification").contains("installed successfully", {timeout: 25000});

            cy.get(".header-button.close").click();
        });

        cy.get('.sheet-tabs > [data-tab="modules"]').click();
        cy.get("#module-list").then(($moduleList) => {
            cy.get(".active > .setup-footer > .install-package").click();

            cy.get(".package-list").should("have.length.gt", 1);

            // There's a quirk here where the close button isn't immediately ready to go. Double clicking just to hide it.
            cy.get("#install-package .header-button.close").dblclick();
            //cy.pause();
        });

        cy.get('.sheet-tabs > [data-tab="worlds"]').click();
        cy.get("#world-list").then(($worldList) => {
            // World already exists
            if ($worldList.find('[data-package-id="integration-test-world"]').length) {
                return;
            }

            cy.get("#create-world").click();

            // Something interrupts focus during the load, so forcing the typing
            cy.get('#world-config form input[name="title"]').type("Integration Test World", {force: true});

            cy.get('#world-config form select[name="system"]').select("Star Wars FFG");

            cy.get('#world-config form [type="submit"]').click();
        });

        // Launch the world
        cy.get('[data-package-id="integration-test-world"] button[data-action="launchWorld"]').click();
    });
}

/** Promise chain until notifications are closed */
function close_notifications() {
    cy.get("#notifications").then(($notifications) => {
        if ($notifications.children().length) {
            // Clicking them in reverse order, because (I think) it avoids a problem
            // with the notification jumping up after the click.
            cy.get("#notifications .close").last().click();

            // Might introduce some brittleness, but I don't know a better way to work around this check right now.
            cy.wait(100);

            close_notifications();
        }
    });
}

/**
 * This is a bit of a pain because these windows could not exist.
 */
function close_initial_popups() {
    cy.get("body").then(($body) => {
        // Dismiss the initial tour on the world
        if ($body.find(".tour").length) {
            cy.get(".tour > .step-header > .step-button").click();
        }

        $body.find(".app > .window-header > .window-title").each((_, titleEl) => {
            const title = Cypress.$(titleEl).text();

            // Dismiss the warning related to not having all the plugins required
            // enabled. This matters on initial world load.
            if (title === "FFG Star Wars Enhancements") {
                cy.get(".app > .window-header > .window-title")
                    .contains("FFG Star Wars Enhancements")
                    .parent()
                    .parent()
                    .find(".dialog-button")
                    .click({force: true}) // Forced because dialogs can overlap
                    .should("not.exist");

                // The above triggers a page reload due to it setting animations to off.
                cy.visit("/game");
                cy.url().should("eq", `${Cypress.config("baseUrl")}/game`);
                wait_until_ready();
            }

            // Dismiss a warning about running head of the foundry codebase
            if (title === "Warning") {
                cy.get(".app > .window-header > .window-title")
                    .contains("Warning")
                    .parent()
                    .parent()
                    .find(".dialog-button")
                    .click({force: true}); // Forced because dialogs can overlap
            }
        });
    });
}

/**
 * Log in as a user
 */
function join(user = "Gamemaster") {
    //  If we try to join, but don't land on the join URL there is a problem
    cy.visit("/join");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/join`);

    cy.get('select[name="userid"]').select(user);
    cy.get('button[name="join"').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/game`);
}

function wait_until_ready() {
    // Verify that both the game and canvas are ready before continuing
    cy.window().its("game").and("have.property", "ready").and("be.true");
    cy.window().its("game").should("have.property", "canvas").and("have.property", "ready").and("be.true");

    cy.get(".paranoia_card_manager_container").should('be.visible');

    close_initial_popups();
    close_initial_popups();
}

function clear_chat() {
    cy.get('.fa-comments').click();
    cy.get('.delete > .fas').click();
    cy.get('.yes').click();
    cy.get('.yes').should('not.be.visible');
}

function close_welcome() {
    if (Cypress.$('#app-1 > .window-content > .dialog-buttons > .dialog-button').length > 0) {
        cy.get('#app-1 > .window-content > .dialog-buttons > .dialog-button').should('be.visible').and('be.enabled');
        cy.get('#app-1 > .window-content > .dialog-buttons > .dialog-button').click({force: true});
    }
}

Cypress.Commands.add("setup", () => {
    setup();
});

Cypress.Commands.add("join", () => {
    join();
});

Cypress.Commands.add("wait_until_ready", () => {
    wait_until_ready();
});

Cypress.Commands.add("clear_chat", () => {
    clear_chat();
});

Cypress.Commands.add("close_welcome", () => {
    close_welcome();
});

Cypress.Commands.add("emulateFocus", (enabled) => {
    // see https://github.com/cypress-io/cypress/issues/21673
    return Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setFocusEmulationEnabled",
        params: {enabled: enabled ?? true},
    });
});
