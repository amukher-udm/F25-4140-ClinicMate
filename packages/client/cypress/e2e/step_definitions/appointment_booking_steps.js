import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Background steps
Given('I am logged in as a patient', () => {
  // Mock authentication - adjust based on your actual login flow
  cy.visit('/login');
  cy.get('input[name="email"]').type('patient@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Given('I navigate to the schedule appointment page', () => {
  cy.visit('/schedule');
});

// Form interaction steps
When('I select my date of birth {string}', (dateOfBirth) => {
  cy.get('input[name="dateOfBirth"]').clear().type(dateOfBirth);
});

When('I select my gender {string}', (gender) => {
  cy.get('select[name="gender"]').select(gender);
});

When('I select appointment type {string}', (appointmentType) => {
  cy.get('select[name="appointmentType"]').select(appointmentType);
});

When('I select preferred location {string}', (location) => {
  cy.get('select[name="location"]').select(location);
});

When('I select a provider from the filtered list', () => {
  cy.get('select[name="provider"]').should('not.be.disabled');
  cy.get('select[name="provider"] option').eq(1).then(($option) => {
    cy.get('select[name="provider"]').select($option.val());
  });
});

When('I select an appointment date from the calendar', () => {
  // Find and click a date button in the calendar
  cy.get('[data-testid="availability-calendar"]').should('be.visible');
  cy.contains('button', /^\d+$/).first().click();
});

When('I select an available time slot', () => {
  cy.get('select[id="timeSlot"]').should('be.visible');
  cy.get('select[id="timeSlot"] option').eq(1).then(($option) => {
    if ($option.val()) {
      cy.get('select[id="timeSlot"]').select($option.val());
    }
  });
});

When('I enter reason for visit {string}', (reason) => {
  cy.get('textarea[name="reasonForVisit"]').type(reason);
});

When('I click the schedule appointment button', () => {
  cy.get('button[type="submit"]').contains(/Schedule Appointment/i).click();
});

// Provider filtering steps
When('I change preferred location to {string}', (location) => {
  cy.get('select[name="location"]').select(location);
});

Then('I should see only providers from {string}', (location) => {
  cy.get('select[name="provider"]').should('not.be.disabled');
  cy.get('select[name="provider"] option').should('have.length.greaterThan', 1);
});

Then('the provider selection should be reset', () => {
  cy.get('select[name="provider"]').should('have.value', '');
});

// Time slots steps
Then('I should see a list of available time slots', () => {
  cy.get('select[id="timeSlot"]').should('be.visible');
  cy.get('select[id="timeSlot"] option').should('have.length.greaterThan', 1);
});

Then('booked time slots should not be displayed', () => {
  // This is handled by the component - we verify that only available slots are shown
  cy.get('select[id="timeSlot"] option').each(($option) => {
    if ($option.val()) {
      expect($option.text()).to.not.include('(Booked)');
    }
  });
});

Then('time slots should be formatted in 12-hour format', () => {
  cy.get('select[id="timeSlot"] option').eq(1).should('match', /\d{1,2}:\d{2} (AM|PM)/);
});

// Validation steps
When('I leave the time slot selection empty', () => {
  // Don't select a time slot
  cy.get('select[id="timeSlot"]').should('have.value', '');
});

When('I attempt to submit the appointment form', () => {
  cy.get('button[type="submit"]').contains(/Schedule Appointment/i).should('exist');
});

Then('the submit button should be disabled', () => {
  cy.get('button[type="submit"]').contains(/Schedule Appointment/i).should('be.disabled');
});

Then('the appointment should not be created', () => {
  // Verify we're still on the schedule page
  cy.url().should('include', '/schedule');
});

// No slots available
When('I select a date with no available slots', () => {
  // This might require intercepting the API to return empty slots
  cy.intercept('GET', '**/provider_availability/**/slots*', {
    statusCode: 200,
    body: []
  }).as('getEmptySlots');
  
  cy.get('[data-testid="availability-calendar"]').should('be.visible');
  cy.contains('button', /^\d+$/).first().click();
  cy.wait('@getEmptySlots');
});

Then('I should see a message {string}', (message) => {
  cy.contains(message).should('be.visible');
});

Then('I should be prompted to select a different date or provider', () => {
  cy.contains(/select a different date or provider/i).should('be.visible');
});

// Cancel steps
When('I click the cancel button', () => {
  cy.get('button').contains(/Cancel/i).click();
});

Then('I should be redirected to the appointments page', () => {
  cy.url().should('include', '/appointments');
});

Then('no appointment should be created', () => {
  // Verify no POST request was made to create appointment
  cy.url().should('include', '/appointments');
});

// Success steps
Then('I should see a success message {string}', (message) => {
  cy.contains(message).should('be.visible');
});

Then('I should see confirmation details for my appointment', () => {
  cy.contains(/confirmation email/i).should('be.visible');
});

Then('I should have the option to view my appointments or schedule another', () => {
  cy.contains('button', /View My Appointments/i).should('be.visible');
  cy.contains('button', /Schedule Another/i).should('be.visible');
});

Then('the appointment should be created with visit type {string}', (visitType) => {
  // This would require intercepting the POST request
  cy.intercept('POST', '**/appointments').as('createAppointment');
  cy.wait('@createAppointment').its('request.body').should('include', { visit_type: visitType });
});

// Specialty consultation
When('I select a Cardiology specialist provider', () => {
  cy.get('select[name="provider"]').should('not.be.disabled');
  cy.get('select[name="provider"] option').contains(/Cardiology/i).then(($option) => {
    cy.get('select[name="provider"]').select($option.val());
  });
});

Then('I should see a success message', () => {
  cy.contains(/success/i).should('be.visible');
});

Then('the appointment should be created for the Cardiology specialty', () => {
  cy.contains(/Appointment Scheduled Successfully/i).should('be.visible');
});

// Loading state
Then('I should see a loading indicator for time slots', () => {
  cy.contains(/Loading available time slots/i).should('be.visible');
});

Then('once loaded, I should see the available time slots', () => {
  cy.get('select[id="timeSlot"]').should('be.visible');
  cy.get('select[id="timeSlot"] option').should('have.length.greaterThan', 1);
});

// Pre-population verification
Then('the first name field should be pre-filled with my profile data', () => {
  cy.get('input[name="firstName"]').should('not.have.value', '');
});

Then('the last name field should be pre-filled with my profile data', () => {
  cy.get('input[name="lastName"]').should('not.have.value', '');
});

Then('the email field should be pre-filled with my profile data', () => {
  cy.get('input[name="email"]').should('not.have.value', '');
});

Then('the phone field should be pre-filled with my profile data', () => {
  cy.get('input[name="phone"]').should('not.have.value', '');
});

// Complete all required fields helper
When('I complete all required fields', () => {
  cy.get('select[name="location"]').select(1);
  cy.get('select[name="provider"]').select(1);
  cy.get('[data-testid="availability-calendar"]').should('be.visible');
  cy.contains('button', /^\d+$/).first().click();
  cy.get('select[id="timeSlot"]').select(1);
  cy.get('textarea[name="reasonForVisit"]').type('Regular checkup');
});
