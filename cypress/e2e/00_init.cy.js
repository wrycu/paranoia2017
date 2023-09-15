describe("paranoia init", () => {
    before(() => {
        //cy.setup();
    });
    beforeEach(() => {
        cy.join();
        cy.wait_until_ready();
    });

    it("initializes the world", () => {
        // Having this test run first more accurately estimates test durations
        cy.log("Initialization complete");
    });
});
