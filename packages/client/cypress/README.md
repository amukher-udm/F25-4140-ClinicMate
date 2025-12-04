# Cypress E2E Testing with BDD (Cucumber)

This directory contains end-to-end tests for the ClinicMate application using Cypress with Behavior-Driven Development (BDD) approach using Cucumber.

## Setup

### Prerequisites
- Node.js and npm installed
- ClinicMate application running locally

### Installation

The dependencies are already installed. If you need to reinstall:

```bash
cd packages/client
npm install
```

## Running Tests

### Interactive Mode (Cypress Test Runner)
```bash
npm run cypress:open
```

This opens the Cypress Test Runner where you can:
- Select and run individual feature files
- Watch tests run in real-time
- Debug test failures
- See detailed step-by-step execution

### Headless Mode (CI/CD)
```bash
npm run cypress:run
```

Or run specific tests:
```bash
npm run test:e2e
```

## Project Structure

```
cypress/
├── e2e/
│   ├── features/                          # Feature files (Gherkin)
│   │   ├── appointment_booking.feature
│   │   └── user_authentication_dashboard.feature
│   └── step_definitions/                  # Step implementations
│       ├── appointment_booking_steps.js
│       └── authentication_dashboard_steps.js
├── support/
│   ├── commands.js                        # Custom Cypress commands
│   └── e2e.js                            # Global configuration
└── cypress.config.js                      # Cypress configuration
```

## Feature Files

### 1. appointment_booking.feature
Tests for the appointment scheduling workflow including:
- ✅ Successfully scheduling appointments
- ✅ Provider filtering by location
- ✅ Time slot selection and display
- ✅ Form validation
- ✅ Empty state handling
- ✅ Cancellation flow
- ✅ Visit type mapping
- ✅ Specialty consultations
- ✅ Loading states
- ✅ Patient information pre-population

**Scenarios:** 10 scenarios covering complete booking flow

### 2. user_authentication_dashboard.feature
Tests for authentication and dashboard features including:
- ✅ Patient login
- ✅ Invalid credentials handling
- ✅ Admin user redirection
- ✅ Protected route access
- ✅ Appointments dashboard view
- ✅ Appointment details
- ✅ Appointment filtering
- ✅ Logout functionality
- ✅ Navigation between pages
- ✅ Profile information display
- ✅ Empty state for new users
- ✅ Session persistence

**Scenarios:** 12 scenarios covering authentication and dashboard

## Step Definitions

### appointment_booking_steps.js
Implements steps for:
- Form field interactions (date, gender, appointment type, etc.)
- Provider filtering logic
- Calendar date selection
- Time slot selection
- Form submission and validation
- Success and error message verification
- Loading state checks

### authentication_dashboard_steps.js
Implements steps for:
- Login/logout flows
- Navigation between pages
- Dashboard data display verification
- Profile information checks
- Filter interactions
- Session management
- Protected route access

## Custom Commands

Located in `cypress/support/commands.js`:

- `cy.login(email, password)` - Login helper
- `cy.logout()` - Logout helper
- `cy.navigateTo(path)` - Navigation helper
- `cy.fillAppointmentForm(data)` - Fill appointment form
- `cy.shouldContainText(selector, text)` - Text verification
- `cy.waitForApiResponse(alias)` - API response waiter

## Writing New Tests

### 1. Create a Feature File

```gherkin
Feature: Feature Name
  As a [role]
  I want to [action]
  So that [benefit]

  Scenario: Scenario description
    Given [precondition]
    When [action]
    Then [expected result]
```

### 2. Implement Step Definitions

```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the page', () => {
  cy.visit('/page');
});

When('I click the button', () => {
  cy.get('button').click();
});

Then('I should see the result', () => {
  cy.contains('Expected Result').should('be.visible');
});
```

## Best Practices

1. **Use descriptive scenario names** - Make it clear what is being tested
2. **Keep scenarios independent** - Each scenario should run standalone
3. **Use Background for common steps** - Reduce repetition
4. **Use data tables** - For multiple similar assertions
5. **Mock API responses** - For consistent test data
6. **Use custom commands** - For frequently used actions
7. **Add waits for async operations** - Ensure elements are loaded

## Debugging

### Viewing Test Results
- Screenshots are saved to `cypress/screenshots/` on test failure
- Videos can be enabled in `cypress.config.js`

### Debug Mode
```bash
# Open Cypress with Chrome DevTools
npm run cypress:open
```

Then:
1. Select the feature file
2. Click on a step to pause execution
3. Inspect elements in the browser
4. Check console logs

### Common Issues

**Issue: "Element not found"**
- Solution: Add `cy.wait()` or use `should('be.visible')`

**Issue: "Timeout waiting for element"**
- Solution: Increase timeout in config or check selector

**Issue: "Cannot read property of undefined"**
- Solution: Ensure the application is running and API is responding

## Configuration

### cypress.config.js
```javascript
{
  baseUrl: 'http://localhost:5173',  // Vite dev server
  specPattern: 'cypress/e2e/features/**/*.feature',
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true
}
```

### package.json Scripts
```json
{
  "cypress:open": "cypress open",      // Interactive mode
  "cypress:run": "cypress run",        // Headless mode
  "test:e2e": "cypress run"           // Alias for CI
}
```

## Before Running Tests

1. **Start the backend server:**
   ```bash
   cd packages/server
   npm start
   ```

2. **Start the frontend dev server:**
   ```bash
   cd packages/client
   npm run dev
   ```

3. **Run Cypress tests:**
   ```bash
   npm run cypress:open
   # or
   npm run cypress:run
   ```

## Test Data

For consistent testing, you may want to:
1. Seed the database with test data
2. Use Cypress fixtures for mock data
3. Intercept API calls for predictable responses

Example fixture (`cypress/fixtures/patient.json`):
```json
{
  "email": "patient@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

## CI/CD Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    npm run test:e2e
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cucumber Preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

## Contributing

When adding new tests:
1. Write the feature file first (BDD approach)
2. Implement step definitions
3. Ensure tests pass locally
4. Commit both feature file and step definitions
5. Update this README if adding new patterns

## Branch Information

Branch: `jorgenep-test-FE`
Based on: `main` branch
Purpose: Frontend E2E testing with Cypress + BDD
