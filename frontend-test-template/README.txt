Front End Skeleton for Cypress Testing
================================================

Where to place these files:
Unzip into project root:/

Resulting structure:
  /
    cypress/
    .cypress-cucumber-preprocessorrc.json
    cypress.config


Install Cypress + Gherkin Packages
npm i -D cypress @badeball/cypress-cucumber-preprocessor @bahmutov/cypress-esbuild-preprocessor esbuild

Add this script to package.json:(root level)
"scripts": {
      "cypress:open": "cypress open",
      "cypress:run": "cypress run",
      ....

How to run:
  Terminal 1: Start your server
    npm run dev 
  Terminal 2: Run Cypress
    npm run cypress:open


The sample test checks (title.feature ,  common.steps.js):
 "When I visit the home page , I should the title page contain the string ClinicMate as a header"
 --Running cypress:open should open a web browser and test and pass this.

