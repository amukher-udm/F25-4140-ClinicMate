Feature: Admin Appointment Management
  As an admin
  I want to view and manage all appointments
  So I can cancel or reschedule them

  Background:
    Given I am logged in as an admin

  Scenario: Viewing the admin dashboard appointments list
    When I navigate to the Admin Dashboard
    Then I should see all appointments displayed

