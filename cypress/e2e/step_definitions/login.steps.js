import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("I visit the Login page", () => {
  cy.visit("/login");
});

When('I type {string} into the email field', (email) => {
  cy.get('input[name="email"]').clear().type(email);
});

When('I type {string} into the password field', (password) => {
  cy.get('input[name="password"]').clear().type(password);
});

Then('the email field should contain {string}', (email) => {
  cy.get('input[name="email"]').should('have.value', email);
});

Then('the password field should contain {string}', (password) => {
  cy.get('input[name="password"]').should('have.value', password);
});

When('I click the show password button', () => {
  cy.get('.show-btn').click();
});

When("I click the show password button again", () => {
  cy.get('.show-btn').click();
});

Then('the password field type should be {string}', (type) => {
  cy.get('input[name="password"]').should('have.attr', 'type', type);
});

Given("I mock a failed login", () => {
  cy.intercept("POST", "**/login", {
    statusCode: 401,
    body: { error: "Invalid email or password." },
  });
});

When("I click the Login button", () => {
  cy.contains("Login").click();
});

Then("I should see a login error modal", () => {
  cy.get('[role="dialog"]').should("be.visible");
  cy.contains(/unable to log in|invalid|verify|error/i).should("be.visible");
});