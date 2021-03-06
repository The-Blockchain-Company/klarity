// @flow
import BigNumber from 'bignumber.js';
import type { Klarity } from '../../../types';

declare var klarity: Klarity;

const STAKING_BUTTON_SIDEBAR = '.SidebarCategory_component.staking';
const DELEGATION_CENTER_PAGE = '.StakingWithNavigation_page';

export const delegationCentreStakingHelper = {
  stakingButtonVisible: async (
    client: Object
  ) =>
    client.waitForVisible(STAKING_BUTTON_SIDEBAR),
  clickStakingButton: async (
    client: Object
  ) =>
    client.click(STAKING_BUTTON_SIDEBAR),
  delegationCenterVisible: async (
    client: Object
  ) =>
    client.waitForVisible(DELEGATION_CENTER_PAGE)
};

export const getStakePoolByRanking = async (client: Object, ranking: number) => {
  const result = await client.execute(ranking => {
    const { stakePools } = klarity.stores.staking;
    return stakePools.find(stakePool => stakePool.ranking === parseInt(ranking, 10))
  }, ranking);
  return result.value;
};

export const getBccEpochData = async function(epoch: 'current' | 'next', param: string) {
  const headerIndex = epoch === 'current' ? 1 : 2;
  return await this.waitAndGetText(`(//div[@class="DelegationCenterHeader_heading"])[${headerIndex}]//following-sibling::div//div[text()="${param}"]//following-sibling::div[@class="DelegationCenterHeader_fieldValue"]`);
};

export const getCurrentEpoch = async function() {
  return await getBccEpochData.call(this, 'current', 'Epoch');
};

export const getNextEpoch = async function() {
  const headerText = await this.waitAndGetText(`(//div[@class="DelegationCenterHeader_heading"])[2]`);
  try {
    return headerText.match(/[1-9]+/)[0];
  } catch(err) {
    return new Error(err);
  }
};
