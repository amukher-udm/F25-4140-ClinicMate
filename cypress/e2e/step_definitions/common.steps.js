import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I visit {string}', (path) => {
  cy.visit(path);
});

Then('I should see the page title contain {string}', (text) => {
  cy.contains('header', text).should('exist');
});
