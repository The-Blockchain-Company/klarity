// @flow
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { expectTextInSelector, waitAndClick, notFoundWalletsErrorMessage } from '../../../common/e2e/steps/helpers';
import { coleMnemonics, sophieMnemonics } from '../../../../utils/api-importer/mnemonics';
import { testStorageKeys } from '../../../common/e2e/steps/config';
import { WalletSyncStateStatuses } from '../../../../source/renderer/app/domains/Wallet';
import type { Klarity } from '../../../types';

declare var klarity: Klarity;

const ADD_WALLET = '.WalletAdd';
const IMPORT_WALLET_BUTTON = '.importWalletButton';
const IMPORT_WALLET_DIALOG = '.WalletFileImportDialog';
const DEFAULT_LANGUAGE = 'en-US';

let sophieMnemonicsIndex = 0;
export const noWalletsErrorMessage = `The cole wallet for funds transfering was already used and has no longer funds.
    Remove the "Klarity Selfnode" directory and run \`nix:dev\` again.`;

export const restoreWalletWithFunds = async (client: Object, { walletName }: { walletName: string }) => {
  const recoveryPhrase = sophieMnemonics[sophieMnemonicsIndex++];
  if (sophieMnemonicsIndex === sophieMnemonics.length) sophieMnemonicsIndex = 0;
  client.executeAsync((name, recoveryPhrase, done) => {

    klarity.api.bcc
      .restoreWallet({
        walletName: name,
        recoveryPhrase,
        spendingPassword: 'Secret1234',
      })
      .then(() =>
        klarity.stores.wallets
          .refreshWalletsData()
          .then(done)
          .catch(error => done(error))
      )
      .catch(error => done(error));
  }, walletName, recoveryPhrase);
};

const getMnemonicsIndex = async function(maxIndex: number) {
  let index = await this.localStorage('GET', testStorageKeys.COLE_MNEMONICS_INDEX) || { value: 0 };
  index = parseInt(index.value, 10);
  if (isNaN(index)) index = 0;
  const newIndex = (index < maxIndex)
    ? index + 1
    : 0;
  await this.localStorage('POST', {
    key: testStorageKeys.COLE_MNEMONICS_INDEX,
    value: String(newIndex),
  });
  return index;
};

export const restoreLegacyWallet = async (
  client: Object,
  {
    walletName,
    hasFunds,
    transferFunds,
  }: {
    walletName: string,
    hasFunds?: boolean,
    transferFunds?: boolean,
  }
) => {
  let recoveryPhrase;
  if (hasFunds) {
    const mnemonics = coleMnemonics;
    const mnemonicsIndex = await getMnemonicsIndex.call(client, (mnemonics.length - 1));
    recoveryPhrase = mnemonics[mnemonicsIndex];
  } else {
    recoveryPhrase = null;
  }
  await client.executeAsync((name, recoveryPhrase, transferFunds, noWalletsErrorMessage, done) => {
    const mnemonics = recoveryPhrase || klarity.utils.crypto.generateMnemonic(12);
    const recoveryPhraseArray = typeof mnemonics === 'string' ? mnemonics.split(' ') : mnemonics;
    klarity.api.bcc
      .restoreColeRandomWallet({
        walletName: name,
        recoveryPhrase: recoveryPhraseArray,
        spendingPassword: 'Secret1234',
      })
      .then(() =>
        klarity.stores.wallets
          .refreshWalletsData()
          .then(() => {
            const wallet = klarity.stores.wallets.getWalletByName(name);

            if (!wallet) {
              throw new Error(notFoundWalletsErrorMessage);
            }

            const walletAmount = wallet.amount || new BigNumber(0);
            if (transferFunds && walletAmount.isZero()) {
              throw new Error(noWalletsErrorMessage);
            }
            done();
          })
          .catch(error => done(error))
      )
      .catch(error => done(error));
  }, walletName, recoveryPhrase, transferFunds, noWalletsErrorMessage);
};

export const fillOutWalletSendForm = async function(values: Object) {
  const formSelector = '.WalletSendForm_component';
  await this.waitAndSetValue(
    `${formSelector} .receiver .SimpleInput_input`,
    values.address
  );
  await this.waitAndSetValue(
    `${formSelector} .amount .SimpleInput_input`,
    values.amount
  );
  if (values.spendingPassword) {
    await this.waitAndSetValue(
      `${formSelector} .spendingPassword .SimpleInput_input`,
      values.spendingPassword
    );
  }
  this.context.walletsendFormValues = values;
};

export const getNameOfActiveWalletInSidebar = async function() {
  return this.waitAndGetText(
    '.SidebarWalletMenuItem_active .SidebarWalletMenuItem_title'
  );
};

export const getWalletByName = async function(walletName: string) {
  const wallet = await this.client.execute(walletName => (
    klarity.stores.wallets.getWalletByName(walletName)
  ), walletName);
  return wallet.value;
};

/**
 * It is not safe to create a BigNumber out the amount
 * got from `client.execute`.
 * This method grabs the Fixed wallet amount
 * which can safely be used to create a BigNumber.
 */
export const getFixedAmountByName = async function(walletName: string) {
  await this.client.waitUntil(async () => {
    const isRestoring = await this.client.execute(
      (walletName) => {
        const wallet = klarity.stores.wallets.getWalletByName(walletName);

        if (!wallet) {
          throw new Error(notFoundWalletsErrorMessage);
        }

        return wallet.isRestoring;
      },
      walletName,
    );
    return !isRestoring.value;
  });
  const walletAmount =
    await this.client.execute(
      (walletName) => {
        const wallet = klarity.stores.wallets.getWalletByName(walletName);

        if (!wallet) {
          throw new Error(notFoundWalletsErrorMessage);
        }

        const amount = wallet.amount || new BigNumber(0);
        return amount.toFixed();
      },
      walletName,
    );
  return walletAmount.value;
};

export const importWalletHelpers = {
  waitForDialog: (
    client: Object,
    { isHidden } : { isHidden: boolean } = {}
  ) =>
    client.waitForVisible(IMPORT_WALLET_DIALOG, null, isHidden),
  clickImport: (
    client: Object
  ) =>
    waitAndClick(client, `${IMPORT_WALLET_DIALOG} .primary`),
  expectError: (
    client: Object,
    { error }: { error: string }
  ) =>
    expectTextInSelector(client, {
      selector: `${IMPORT_WALLET_DIALOG}_error`,
      text: error,
    }),
};

export const importWalletWithFunds = async (
  client: Object,
  { keyFilePath, password }: { keyFilePath: string, password: ?string }
) =>
  client.executeAsync(
    (filePath, spendingPassword, done) => {
      klarity.api.bcc
        .importWalletFromKey({ filePath, spendingPassword })
        .then(() =>
          klarity.stores.wallets
            .refreshWalletsData()
            .then(done)
            .catch(error => done(error))
        )
        .catch(error => done(error));
    },
    keyFilePath,
    password
  );

export const isActiveWalletBeingRestored = async (client: Object) => {
  const result = await client.execute(
    expectedSyncTag =>
      klarity.stores.wallets.active === expectedSyncTag,
    WalletSyncStateStatuses.RESTORING
  );
  return result.value ? result.value.syncState.tag : false;
};

export const waitUntilWalletIsLoaded = async function(walletName: string): Promise<any> {
  let wallet = null;
  const context = this;
  await context.client.waitUntil(async () => {
    const result = await context.client.execute(
      (name) => klarity.stores.wallets.getWalletByName(name),
      walletName
    );
    if (result.value) {
      wallet = result.value;
      return true;
    }
    return false;
  });
  return wallet;
};

export const waitUntilWaletNamesEqual = function(walletName: string) {
  const context = this;
  return context.client.waitUntil(async () => {
    const currentWalletName = await getNameOfActiveWalletInSidebar.call(
      context
    );
    return currentWalletName === walletName;
  });
};

export const expectActiveWallet = async function(walletName: string) {
  const displayedWalletName = await getNameOfActiveWalletInSidebar.call(this);
  expect(displayedWalletName.toLowerCase().trim()).to.equal(
    walletName.toLowerCase().trim()
  );
};

export const createWallets = async function(
  wallets: Array<any>,
  options?: {
    sequentially?: boolean,
    isLegacy?: boolean,
  } = {}
) {
  if (options.sequentially === true) {
    await createWalletsSequentially.call(this, wallets);
  } else {
    await createWalletsAsync.call(this, wallets, options.isLegacy);
  }
};

const createWalletsSequentially = async function(wallets: Array<any>) {
  for (const walletData of wallets) {
    await this.client.executeAsync((wallet, done) => {
      const mnemonic = klarity.utils.crypto.generateMnemonic(24);
      const walletDetails = {
        name: wallet.name,
        mnemonic,
        spendingPassword: wallet.password || 'Secret1234',
      };
      klarity.api.bcc
        .createWallet(walletDetails)
        .then(() =>
          klarity.stores.wallets.walletsRequest
            .execute()
            .then(storeWallets =>
              klarity.stores.wallets
                .refreshWalletsData()
                .then(() => done(storeWallets))
                .catch(error => done(error))
            )
            .catch(error => done(error))
        )
        .catch(error => done(error.stack));
    }, walletData);
    await waitUntilWalletIsLoaded.call(this, walletData.name);
  }
};

const createWalletsAsync = async function(table, isLegacy?: boolean) {
  const result = await this.client.executeAsync((wallets, isLegacyWallet, done) => {
    const mnemonics = {};
    const { restoreColeRandomWallet, createWallet } = klarity.api.bcc;
    const mnemonicsLength = isLegacyWallet ? 12 : 24;

    window.Promise.all(
      wallets.map(wallet => {
        const mnemonic = klarity.utils.crypto.generateMnemonic(mnemonicsLength);
        const recoveryPhrase = !isLegacyWallet
          ? mnemonic
          : mnemonic.split(' ');
        mnemonics[wallet.name] = mnemonic.split(' ');
        const walletDetails = {
          name: wallet.name,
          walletName: wallet.name,
          mnemonic,
          recoveryPhrase,
          spendingPassword: wallet.password || 'Secret1234',
        };
        if (!isLegacyWallet) {
          return createWallet(walletDetails);
        }
        return restoreColeRandomWallet({
          name: wallet.name,
          walletName: wallet.name,
          mnemonic,
          recoveryPhrase,
          spendingPassword: wallet.password || 'Secret1234',
        });
      })
    )
      .then(() =>
        klarity.stores.wallets
          .refreshWalletsData()
          .then(() => done({ mnemonics }))
          .catch(error => done(error))
      )
      .catch(error => done(error));
  }, table, isLegacy);

  this.mnemonics = Object.assign(
    {},
    result.value.mnemonics,
    this.mnemonics,
  );
};

export const getCurrentAppRoute = async function() {
  const url = (await this.client.url()).value;
  return url.substring(url.indexOf('#/') + 1); // return without the hash
};

export const waitUntilUrlEquals = function(expectedUrl: string) {
  const context = this;
  return context.client.waitUntil(async () => {
    const url = await getCurrentAppRoute.call(context);
    return url === expectedUrl;
  });
};

export const navigateTo = function(requestedRoute: string) {
  return this.client.execute(route => {
    klarity.actions.router.goToRoute.trigger({ route });
  }, requestedRoute);
};

export const sidebar = {
  activateCategory: async (client: Object, { category }: { category: string }) => {
    await client.execute(cat => {
      klarity.actions.sidebar.activateSidebarCategory.trigger({
        category: cat,
        showSubMenu: true,
      });
    }, `/${category}`);
    return client.waitForVisible(`.SidebarCategory_active.${category}`);
  },
  clickAddWalletButton: (client: Object) =>
    waitAndClick(client, '.SidebarWalletsMenu_addWalletButton'),
};

export const addWalletPage = {
  waitForVisible: (client: Object, { isHidden }: { isHidden?: boolean } = {}) =>
    client.waitForVisible(ADD_WALLET, null, isHidden),
  clickImportButton: (client: Object) =>
    waitAndClick(client, `${ADD_WALLET} ${IMPORT_WALLET_BUTTON}`),
};

export default {
  waitForDialog: (client: Object, { isHidden }: { isHidden?: boolean } = {}) =>
    client.waitForVisible(IMPORT_WALLET_DIALOG, null, isHidden),
  selectFile: (client: Object, { filePath }: { filePath: string }) =>
    client.chooseFile(
      `${IMPORT_WALLET_DIALOG} .FileUploadWidget_dropZone input`,
      filePath
    ),
  clickImport: (client: Object) =>
    waitAndClick(client, `${IMPORT_WALLET_DIALOG} .primary`),
  expectError: (client: Object, { error }: { error: string }) =>
    expectTextInSelector(client, {
      selector: `${IMPORT_WALLET_DIALOG}_error`,
      text: error,
    }),
};

export const i18n = {
  formatMessage: async (
    client: Object,
    { id, values }: { id: string, values?: Object }
  ) => {
    const translation = await client.execute(
      (translationId, translationValues) => {
        const IntlProvider = require('react-intl').IntlProvider; // eslint-disable-line
        const locale = klarity.stores.profile.currentLocale;
        const messages = klarity.translations;
        const intlProvider = new IntlProvider(
          { locale, messages: messages[locale] },
          {}
        );
        return intlProvider
          .getChildContext()
          .intl.formatMessage({ id: translationId }, translationValues);
      },
      id,
      values || {}
    );
    return translation.value;
  },
  setActiveLanguage: async (
    client: Object,
    { language }: { language: string } = {}
  ) =>
    client.execute(value => {
      klarity.actions.profile.updateUserLocalSetting.trigger({ param: 'locale', value });
    }, language || DEFAULT_LANGUAGE),
};

export const waitForActiveRestoreNotification = (client: Object, { isHidden }: { isHidden?: boolean } = {}) =>
  client.waitForVisible('.ActiveRestoreNotification', null, isHidden);

export const getWalletType = async function(_type?: string = '') {
  let type = _type ? _type.trim() : null;
  if (type === 'cole') return 'cole';
  if (!type) {
    type = 'sophie';
  }
  return type;
};

export const restoreWallet = async function(walletName: string, kind: string, subkind: string, recovery_phrase: string) {
  await this.client.executeAsync((done) => {
    klarity.stores.wallets._pausePolling().then(done);
  });
  let recoveryPhrase = recovery_phrase.split(' ');
  await this.client.executeAsync((walletName, kind, subkind, recoveryPhrase, done) => {
    const {
      restoreWalletSetKind,
      restoreWalletSetMnemonics,
      restoreWalletSetConfig,
    } = klarity.actions.wallets;
    restoreWalletSetKind.trigger({ kind });
    restoreWalletSetKind.trigger({ param: kind, kind: subkind });
    const { restoreRequest } = klarity.stores.wallets;
    const spendingPassword = 'Secret1234';
    const data = {
      recoveryPhrase,
      walletName,
      spendingPassword,
    };
    restoreRequest.execute(data)
      .then(() => {
        klarity.stores.wallets._resumePolling();
        klarity.stores.wallets.refreshWalletsData()
          .then(done)
      })
      .catch(error => done(error));
  }, walletName, kind, subkind, recoveryPhrase);
};
