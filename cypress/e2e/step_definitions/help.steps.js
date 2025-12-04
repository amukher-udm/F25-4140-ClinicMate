import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("I visit the Help page", () => {
  cy.visit("/help");
});

Then("I should see the heading {string}", (headingText) => {
  cy.contains("h1", headingText).should("be.visible");
});

When('I click the FAQ question {string}', (questionText) => {
  cy.contains(".faq-question", questionText).click();
});

Then('I should see the answer {string}', (answerText) => {
  cy.contains(".faq-answer", answerText).should("be.visible");
});

When("I fill in the contact form with valid data", () => {
  cy.get('input[name="name"]').type("Test User");
  cy.get('input[name="email"]').type("testuser@example.com");
  cy.get('input[name="subject"]').type("Test Subject");
  cy.get('textarea[name="message"]').type("This is a test message.");
});

When("I submit the contact form", () => {
  cy.get(".contact-form").submit();
});

Then('I should see a success message {string}', (msg) => {
  cy.contains(".success-popup", msg).should("be.visible");
});