Feature: Appointment Booking Flow
  As a patient user
  I want to schedule medical appointments
  So that I can receive healthcare services at my preferred time and location

  Background:
    Given I am logged in as a patient
    And I navigate to the schedule appointment page

  Scenario: Successfully schedule a new appointment with all required information
    When I select my date of birth "1990-05-15"
    And I select my gender "Male"
    And I select appointment type "New Patient"
    And I select preferred location "City General Hospital"
    And I select a provider from the filtered list
    And I select an appointment date from the calendar
    And I select an available time slot
    And I enter reason for visit "Annual checkup and general health assessment"
    And I click the schedule appointment button
    Then I should see a success message "Appointment Scheduled Successfully"
    And I should see confirmation details for my appointment
    And I should have the option to view my appointments or schedule another

  Scenario: Filter providers based on selected hospital location
    When I select preferred location "City General Hospital"
    Then I should see only providers from "City General Hospital"
    When I change preferred location to "Metro Medical Center"
    Then the provider selection should be reset
    And I should see only providers from "Metro Medical Center"

  Scenario: View available time slots for selected provider and date
    When I select preferred location "City General Hospital"
    And I select a provider from the filtered list
    And I select an appointment date from the calendar
    Then I should see a list of available time slots
    And booked time slots should not be displayed
    And time slots should be formatted in 12-hour format

  Scenario: Prevent appointment booking without required information
    When I leave the time slot selection empty
    And I attempt to submit the appointment form
    Then the submit button should be disabled
    And the appointment should not be created

  Scenario: Handle no available time slots gracefully
    When I select preferred location "City General Hospital"
    And I select a provider from the filtered list
    And I select a date with no available slots
    Then I should see a message "No available time slots for this provider on this date"
    And I should be prompted to select a different date or provider

  Scenario: Cancel appointment booking and return to appointments page
    When I click the cancel button
    Then I should be redirected to the appointments page
    And no appointment should be created

  Scenario: Map visit types correctly for backend processing
    When I select appointment type "General Checkup"
    And I complete all required fields
    And I select an available time slot
    And I click the schedule appointment button
    Then the appointment should be created with visit type "annual_physical"

  Scenario: Schedule a specialty consultation appointment
    When I select appointment type "Cardiology Consultation"
    And I select preferred location "City General Hospital"
    And I select a Cardiology specialist provider
    And I select an appointment date from the calendar
    And I select an available time slot
    And I enter reason for visit "Chest pain and irregular heartbeat"
    And I click the schedule appointment button
    Then I should see a success message
    And the appointment should be created for the Cardiology specialty

  Scenario: Display loading state while fetching time slots
    When I select preferred location "City General Hospital"
    And I select a provider from the filtered list
    And I select an appointment date from the calendar
    Then I should see a loading indicator for time slots
    And once loaded, I should see the available time slots

  Scenario: Verify patient information pre-population
    Then the first name field should be pre-filled with my profile data
    And the last name field should be pre-filled with my profile data
    And the email field should be pre-filled with my profile data
    And the phone field should be pre-filled with my profile data
