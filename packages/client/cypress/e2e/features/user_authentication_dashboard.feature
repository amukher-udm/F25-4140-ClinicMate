Feature: User Authentication and Dashboard Views
  As a user of the ClinicMate platform
  I want to securely access my account and view relevant dashboard information
  So that I can manage my healthcare appointments and information

  Scenario: Patient login with valid credentials
    Given I am on the login page
    When I enter email "patient@example.com"
    And I enter password "password123"
    And I click the login button
    Then I should be redirected to the home page or appointments page
    And I should see my name in the navigation bar

  Scenario: Login with invalid credentials
    Given I am on the login page
    When I enter email "patient@example.com"
    And I enter password "wrongpassword"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  Scenario: Admin user redirection to admin dashboard
    Given I am on the login page
    When I login as an admin user
    Then I should be redirected to the admin dashboard
    And I should see admin-specific features

  Scenario: Unauthorized access to protected pages
    Given I am not logged in
    When I attempt to navigate to the schedule appointment page
    Then I should be redirected to the login page

  Scenario: View appointments dashboard as a patient
    Given I am logged in as a patient
    When I navigate to my appointments page
    Then I should see a list of my scheduled appointments
    And each appointment should display the date, time, provider, and location
    And I should have options to reschedule or cancel appointments

  Scenario: View appointment details
    Given I am logged in as a patient
    And I have at least one scheduled appointment
    When I click on an appointment
    Then I should see detailed information including:
      | Field                | 
      | Appointment Date     |
      | Appointment Time     |
      | Provider Name        |
      | Hospital Location    |
      | Visit Type           |
      | Reason for Visit     |

  Scenario: Filter appointments by status
    Given I am logged in as a patient
    And I am on the appointments page
    When I filter by "Upcoming" appointments
    Then I should see only future appointments
    When I filter by "Past" appointments
    Then I should see only completed appointments

  Scenario: Logout from the application
    Given I am logged in as a patient
    When I click the logout button
    Then I should be logged out
    And I should be redirected to the login page
    And my session should be cleared

  Scenario: Navigate to different sections from the navigation bar
    Given I am logged in as a patient
    When I click on "Home" in the navigation
    Then I should be on the home page
    When I click on "Appointments" in the navigation
    Then I should be on the appointments page
    When I click on "Schedule" in the navigation
    Then I should be on the schedule appointment page

  Scenario: View profile information
    Given I am logged in as a patient
    When I navigate to my profile page
    Then I should see my personal information:
      | Field        |
      | First Name   |
      | Last Name    |
      | Email        |
      | Phone Number |
      | Date of Birth|

  Scenario: Empty appointments dashboard for new users
    Given I am logged in as a new patient with no appointments
    When I navigate to my appointments page
    Then I should see a message "You have no scheduled appointments"
    And I should see a button to "Schedule New Appointment"

  Scenario: Session persistence across page refreshes
    Given I am logged in as a patient
    When I refresh the page
    Then I should remain logged in
    And I should still see my user information
