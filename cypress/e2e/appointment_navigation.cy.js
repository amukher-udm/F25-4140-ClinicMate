Cypress.Commands.add("loginAsUser", () => {
  cy.visit("http://localhost:3000/login");

  cy.intercept("POST", "/api/login").as("loginRequest");

  cy.get('input[name="email"]').type('williacj7@udmercy.edu'); // Am aware of the security risk here, but this is a test account
  cy.get('input[name="password"]').type('982270cw1');

  cy.get('button[type="submit"]').click();

  cy.location("pathname").should("not.include", "login");   // Ensures dashboard loads before continuing

  cy.log("User logged in");
});


describe("Appointments Page - Navigation Tests", () => {

it("loads the appointments page", () => {
    cy.loginAsUser();                        
    cy.visit("http://localhost:3000/Appointments"); 
    cy.contains("My Appointments").should("exist");

});

it("should navigate all appointments", () => {
  cy.loginAsUser();
  cy.visit("http://localhost:3000/Appointments");

  // --- Scheduled Tab ---
  cy.contains("button", "Scheduled").click();

  // Should show at least 1 scheduled appointment
  cy.get(".appointment-card").should("exist");

  // --- Completed Tab ---
  cy.contains("button", "Completed").click();

  // "No completed appointments found."
  cy.contains("No completed appointments found.").should("exist");

  // --- Cancelled Tab ---
  cy.contains("button", "Cancelled").click();
  cy.wait(1000)

  cy.get(".appointments-list").should("exist");
});

it("should reschedule the scheduled appointment to December 4th", () => {
  cy.loginAsUser();
  cy.visit("http://localhost:3000/Appointments");

  // --- Click Scheduled tab ---
  cy.contains("button", "Scheduled").click();

  cy.wait(1000); // Noticed there's an animation where all cards are briefly visible, messing with the click function. Added a slight delay

  cy.get(".appointment-card").first().click();

  cy.contains("button", "Reschedule").click();

  cy.contains("4").click();
  cy.get('#timeSlot') // Previously, the select had no id, now it does making it easier to grab
  .should('be.visible')
  .select('10:30 A.M - 11:00 A.M')
  cy.contains("Save Changes").click(); 

});

it('clicks an appointment and cancels it', () => {
    cy.loginAsUser();
    cy.visit("http://localhost:3000/Appointments");
    cy.contains("button", "Scheduled").click();

    cy.wait(1000); 

    cy.get(".appointment-card").first().click();

    // Click Delete
    cy.contains('button', /^Cancel$/).click();
    cy.contains('button', /^Cancel Appointment$/).click();
    cy.contains('No scheduled appointments found.').should('exist');

    // To confirm, check Cancelled tab
    cy.contains('button', 'Cancelled').click();

  });
    
  });


