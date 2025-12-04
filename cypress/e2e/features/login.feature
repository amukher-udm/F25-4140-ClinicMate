Feature: Login Page UI

  As a returning patient
  I want to log in with email and password
  So that I can access my account securly
  
  Scenario: User enters email and password
    Given I visit the Login page
    When I type "test@example.com" into the email field
    And I type "Password123!" into the password field
    Then the email field should contain "test@example.com"
    And the password field should contain "Password123!"

  Scenario: User clicks show password
    Given I visit the Login page
    When I type "Password123!" into the password field
    And I click the show password button
    Then the password field type should be "text"
    When I click the show password button again
    Then the password field type should be "password"

  Scenario: User sees error modal on failed login
    Given I visit the Login page
    And I mock a failed login
    When I click the Login button
    Then I should see a login error modal