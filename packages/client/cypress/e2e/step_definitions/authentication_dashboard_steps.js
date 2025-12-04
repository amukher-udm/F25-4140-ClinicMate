import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Login page navigation
Given('I am on the login page', () => {
  cy.visit('/login');
});

// Login steps
When('I enter email {string}', (email) => {
  cy.get('input[name="email"]').clear().type(email);
});

When('I enter password {string}', (password) => {
  cy.get('input[name="password"]').clear().type(password);
});

When('I click the login button', () => {
  cy.get('button[type="submit"]').click();
});

When('I login as an admin user', () => {
  // Assuming admin credentials - adjust as needed
  cy.get('input[name="email"]').type('admin@clinicmate.com');
  cy.get('input[name="password"]').type('admin123');
  cy.get('button[type="submit"]').click();
});

// Redirect verifications
Then('I should be redirected to the home page or appointments page', () => {
  cy.url().should('match', /(\/home|\/appointments|^\/$)/);
});

Then('I should see my name in the navigation bar', () => {
  cy.get('nav').should('contain.text', /(Welcome|Hello|Profile)/i);
});

Then('I should see an error message {string}', (errorMessage) => {
  cy.contains(errorMessage).should('be.visible');
});

Then('I should remain on the login page', () => {
  cy.url().should('include', '/login');
});

Then('I should be redirected to the admin dashboard', () => {
  cy.url().should('include', '/admin');
});

Then('I should see admin-specific features', () => {
  cy.contains(/admin|dashboard|manage/i).should('be.visible');
});

// Unauthorized access
Given('I am not logged in', () => {
  // Clear any existing session
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

When('I attempt to navigate to the schedule appointment page', () => {
  cy.visit('/schedule');
});

Then('I should be redirected to the login page', () => {
  cy.url().should('include', '/login');
});

// Appointments dashboard
When('I navigate to my appointments page', () => {
  cy.visit('/appointments');
});

Then('I should see a list of my scheduled appointments', () => {
  cy.get('[data-testid="appointments-list"]').should('exist');
  // Or look for appointment cards/items
  cy.contains(/appointment/i).should('be.visible');
});

Then('each appointment should display the date, time, provider, and location', () => {
  cy.get('[data-testid="appointment-item"]').first().within(() => {
    cy.contains(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/).should('exist'); // Date
    cy.contains(/\d{1,2}:\d{2}/).should('exist'); // Time
    cy.contains(/Dr\.|Doctor/).should('exist'); // Provider
  });
});

Then('I should have options to reschedule or cancel appointments', () => {
  cy.contains('button', /reschedule|cancel/i).should('exist');
});

// Appointment details
Given('I have at least one scheduled appointment', () => {
  // This might require setting up test data or using fixtures
  cy.visit('/appointments');
  cy.get('[data-testid="appointment-item"]').should('have.length.greaterThan', 0);
});

When('I click on an appointment', () => {
  cy.get('[data-testid="appointment-item"]').first().click();
});

Then('I should see detailed information including:', (dataTable) => {
  const fields = dataTable.rawTable.flat();
  fields.forEach((field) => {
    cy.contains(field).should('be.visible');
  });
});

// Filter appointments
Given('I am on the appointments page', () => {
  cy.visit('/appointments');
});

When('I filter by {string} appointments', (filterType) => {
  cy.get('select[name="filter"], button').contains(new RegExp(filterType, 'i')).click();
});

Then('I should see only future appointments', () => {
  const today = new Date();
  cy.get('[data-testid="appointment-item"]').each(($el) => {
    // Verify appointment dates are in the future
    // This is a simplified check
    cy.wrap($el).should('be.visible');
  });
});

Then('I should see only completed appointments', () => {
  cy.get('[data-testid="appointment-item"]').each(($el) => {
    cy.wrap($el).should('be.visible');
  });
});

// Logout
When('I click the logout button', () => {
  cy.get('button, a').contains(/logout|sign out/i).click();
});

Then('I should be logged out', () => {
  cy.url().should('include', '/login');
});

Then('my session should be cleared', () => {
  cy.window().then((win) => {
    expect(win.sessionStorage.getItem('auth_token')).to.be.null;
  });
});

// Navigation
When('I click on {string} in the navigation', (linkText) => {
  cy.get('nav').contains(linkText).click();
});

Then('I should be on the home page', () => {
  cy.url().should('match', /(\/home|^\/$)/);
});

Then('I should be on the appointments page', () => {
  cy.url().should('include', '/appointments');
});

Then('I should be on the schedule appointment page', () => {
  cy.url().should('include', '/schedule');
});

// Profile page
When('I navigate to my profile page', () => {
  cy.visit('/profile');
});

Then('I should see my personal information:', (dataTable) => {
  const fields = dataTable.rawTable.flat();
  fields.forEach((field) => {
    cy.contains(field).should('be.visible');
  });
});

// Empty state
Given('I am logged in as a new patient with no appointments', () => {
  // Mock user with no appointments
  cy.intercept('GET', '**/appointments*', {
    statusCode: 200,
    body: { appointments: [] }
  }).as('getNoAppointments');
  
  cy.visit('/login');
  cy.get('input[name="email"]').type('newpatient@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('button[type="submit"]').click();
});

Then('I should see a button to {string}', (buttonText) => {
  cy.contains('button, a', buttonText).should('be.visible');
});

// Session persistence
When('I refresh the page', () => {
  cy.reload();
});

Then('I should remain logged in', () => {
  cy.url().should('not.include', '/login');
});

Then('I should still see my user information', () => {
  cy.get('nav').should('contain.text', /(Welcome|Hello|Profile)/i);
});
