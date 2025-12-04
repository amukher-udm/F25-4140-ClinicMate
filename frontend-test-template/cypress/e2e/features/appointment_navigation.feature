Feature: Appointment Navigation
  As a user
  I want to navigate through my appointments
  So I can view scheduled, completed, and cancelled appointments

  Background:
    Given I am logged in as a user
    And I am on the Appointments page

  Scenario: Viewing the appointments page
    When I visit the Appointments page
    Then I should see "My Appointments" displayed

  Scenario: Navigating to Scheduled appointments
    When I click the "Scheduled" tab
    Then I should see at least one scheduled appointment card

  Scenario: Navigating to Completed appointments
    When I click the "Completed" tab
    Then I should see the message "No completed appointments found."

  Scenario: Navigating to Cancelled appointments
    When I click the "Cancelled" tab
    Then I should see the cancelled appointments list
