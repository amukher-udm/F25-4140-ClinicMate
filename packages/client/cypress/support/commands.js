// Custom Cypress commands for ClinicMate application

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  // Wait for redirect after successful login
  cy.url().should('not.include', '/login');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('Logout').click();
});

// Navigate to a specific page
Cypress.Commands.add('navigateTo', (path) => {
  cy.visit(path);
});

// Fill appointment form
Cypress.Commands.add('fillAppointmentForm', (appointmentData) => {
  if (appointmentData.dateOfBirth) {
    cy.get('input[name="dateOfBirth"]').type(appointmentData.dateOfBirth);
  }
  if (appointmentData.gender) {
    cy.get('select[name="gender"]').select(appointmentData.gender);
  }
  if (appointmentData.appointmentType) {
    cy.get('select[name="appointmentType"]').select(appointmentData.appointmentType);
  }
  if (appointmentData.location) {
    cy.get('select[name="location"]').select(appointmentData.location);
  }
  if (appointmentData.provider) {
    cy.get('select[name="provider"]').select(appointmentData.provider);
  }
  if (appointmentData.reason) {
    cy.get('textarea[name="reasonForVisit"]').type(appointmentData.reason);
  }
});

// Check if element contains text
Cypress.Commands.add('shouldContainText', (selector, text) => {
  cy.get(selector).should('contain', text);
});

// Wait for API response
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});
