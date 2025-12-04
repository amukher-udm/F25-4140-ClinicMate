Feature: Help Page
  As a user
  I want to view the Help page
  So that I can access FAQs and contact support

  Scenario: Viewing the Help page
    Given I visit the Help page
    Then I should see the heading "Help & Support"

  Scenario: Toggle FAQ questions
    Given I visit the Help page
    When I click the FAQ question "How do I book an appointment?"
    Then I should see the answer "You can book an appointment from the Explore page by selecting a doctor or hospital and following the booking steps."

  Scenario: Submit contact form successfully
    Given I visit the Help page
    When I fill in the contact form with valid data
    And I submit the contact form
    Then I should see a success message "Message sent successfully!"