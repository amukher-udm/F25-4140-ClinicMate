Feature: App loads
  As a user
  I want to load the ClinicMate app
  So that I can use its features

  Scenario: Root page renders
    Given I visit "/"
    Then I should see the page title contain "ClinicMate"
