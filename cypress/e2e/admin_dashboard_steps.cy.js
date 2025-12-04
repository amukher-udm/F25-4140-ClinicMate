// cypress/e2e/appointments/appointment-navigation.steps.js
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("http://localhost:3000/login");

  cy.intercept("POST", "/api/login").as("loginRequest");

  cy.get('input[name="email"]').type('amukher@udmercy.edu'); // Am aware of the security risk here, but this is a test account
  cy.get('input[name="password"]').type('admin2!3%');

  cy.get('button[type="submit"]').click();

  cy.location("pathname").should("not.include", "login");   // Ensures dashboard loads before continuing

  cy.log("User logged in");
});

describe("Appointments Page - Navigation Tests", () => {

it("I'm able to log in as admin", () => {
    cy.loginAsAdmin();                        
    cy.visit("http://localhost:3000/Schedule"); 
    cy.contains("Admin Dashboard").should("exist");

});

});

``
