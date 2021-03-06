// @flow
import { Given, When, Then } from 'cucumber';
import type { Klarity } from '../../../types';

declare var klarity: Klarity;

const SELECTORS = {
  COMPONENT: '.DataLayerMigrationForm_component',
  SUBMIT_BTN: '.DataLayerMigrationForm_submitButton',
};

Given(/^I haven't accepted the data layer migration$/, async function() {
  await this.client.execute(() => {
    klarity.api.localStorage.unsetDataLayerMigrationAcceptance();
  });
});

Then(/^I should see the Data Layer Migration screen$/, function() {
  return this.client.waitForVisible(SELECTORS.COMPONENT);
});

Then(/^I should not see the Data Layer Migration screen$/, function() {
  return this.client.waitForVisible(
    SELECTORS.COMPONENT,
    null,
    true
  );
});

When(/^I click the migration button$/, function() {
  return this.waitAndClick(
    `${SELECTORS.COMPONENT} ${SELECTORS.SUBMIT_BTN}`
  );
});
