// @flow
import { has, find, last, filter, findIndex } from 'lodash';
import { observable, computed, action, runInAction } from 'mobx';
import Store from './lib/Store';
import CachedRequest from './lib/LocalizedCachedRequest';
import WalletAddress from '../domains/WalletAddress';
import Request from './lib/LocalizedRequest';
import LocalizableError from '../i18n/LocalizableError';
import { getStakeAddressFromStakeKey } from '../utils/crypto';
import type { Address, InspectAddressResponse } from '../api/addresses/types';

export default class AddressesStore extends Store {
  @observable lastGeneratedAddress: ?WalletAddress = null;
  @observable addressesRequests: Array<{
    walletId: string,
    isLegacy: boolean,
    allRequest: CachedRequest<Array<WalletAddress>>,
  }> = [];
  @observable stakeAddresses: {
    [walletId: string]: string,
  } = {};
  @observable error: ?LocalizableError = null;

  // REQUESTS

  @observable createColeWalletAddressRequest: Request<Address> = new Request(
    this.api.bcc.createAddress
  );

  @observable
  inspectAddressRequest: Request<InspectAddressResponse> = new Request(
    this.api.bcc.inspectAddress
  );

  setup() {
    const actions = this.actions.addresses;
    actions.createColeWalletAddress.listen(this._createColeWalletAddress);
    actions.resetErrors.listen(this._resetErrors);
  }

  _createColeWalletAddress = async (params: {
    walletId: string,
    passphrase: string,
  }) => {
    try {
      const { walletId, passphrase } = params;
      const accountIndex = await this.getAccountIndexByWalletId(walletId);

      const address: WalletAddress = await this.createColeWalletAddressRequest.execute(
        {
          addressIndex: accountIndex,
          passphrase,
          walletId,
        }
      ).promise;

      if (address != null) {
        this._refreshAddresses();
        runInAction('set last generated address and reset error', () => {
          this.lastGeneratedAddress = address;
          this.error = null;
        });
      }
    } catch (error) {
      runInAction('set error', () => {
        this.error = error;
      });
    }
  };

  _inspectAddress = async (params: { addressId: string }) => {
    const { addressId } = params;
    this.inspectAddressRequest.reset();
    const addressDetails = await this.inspectAddressRequest.execute({
      addressId,
    }).promise;
    return addressDetails;
  };

  @computed get all(): Array<WalletAddress> {
    const wallet = this.stores.wallets.active;
    if (!wallet) return [];
    const addresses = this._getAddressesAllRequest(wallet.id).result;
    return addresses || [];
  }

  @computed get hasAny(): boolean {
    const wallet = this.stores.wallets.active;
    if (!wallet) return false;
    const addresses = this._getAddressesAllRequest(wallet.id).result;
    return addresses ? addresses.length > 0 : false;
  }

  @computed get active(): ?WalletAddress {
    const wallet = this.stores.wallets.active;
    if (!wallet) return null;

    // If address generated and not used, set as active address
    if (this.lastGeneratedAddress && !this.lastGeneratedAddress.used)
      return this.lastGeneratedAddress;

    // Check if wallet has addresses
    const addresses = this._getAddressesAllRequest(wallet.id).result;
    if (!addresses) return null;

    // Check if there is any unused address and set last as active
    const unusedAddresses = filter(addresses, (address) => !address.used);
    if (unusedAddresses.length) return last(unusedAddresses);

    // Set last used address as active
    return last(addresses);
  }

  @computed get totalAvailable(): number {
    const wallet = this.stores.wallets.active;
    if (!wallet) return 0;
    const addresses = this._getAddressesAllRequest(wallet.id).result;
    return addresses ? addresses.length : 0;
  }

  @computed get stakeAddress(): string {
    const wallet = this.stores.wallets.active;
    if (!wallet) return '';
    return this.stakeAddresses[wallet.id] || '';
  }

  @action _getStakeAddress = async (walletId: string, isLegacy: boolean) => {
    const hasStakeAddress = has(this.stakeAddresses, walletId);
    if (!hasStakeAddress) {
      if (isLegacy) {
        this.stakeAddresses[walletId] = '';
      } else {
        const getWalletStakeKeyRequest = new Request(
          this.api.bcc.getWalletPublicKey
        );
        const stakeKeyBech32 = await getWalletStakeKeyRequest.execute({
          walletId,
          role: 'mutable_account',
          index: '0',
        });
        const stakeAddress = getStakeAddressFromStakeKey(stakeKeyBech32);
        runInAction('set stake address', () => {
          this.stakeAddresses[walletId] = stakeAddress;
        });
      }
    }
  };

  @action _refreshAddresses = () => {
    if (this.stores.networkStatus.isConnected) {
      const { all } = this.stores.wallets;
      for (const wallet of all) {
        const { id: walletId, isLegacy } = wallet;
        const allRequest = this._getAddressesAllRequest(walletId);
        allRequest.invalidate({ immediately: false });
        allRequest.execute({ walletId, isLegacy });
        this._getStakeAddress(walletId, isLegacy);
      }
    }
  };

  @action _resetErrors = () => {
    this.error = null;
  };

  isInternalAddress = (address: string): boolean => {
    return findIndex(this.all, { id: address }) > -1;
  };

  getAddressIndex = (address: string): number => {
    return this.all.length - findIndex(this.all, { id: address }) - 1;
  };

  getAccountIndexByWalletId = async (walletId: string): Promise<?number> => {
    // $FlowFixMe
    const result = await this.api.bcc.getAddresses({
      walletId,
      isLegacy: true,
    });
    return result ? result.accountIndex : null;
  };

  getAddressesByWalletId = async (
    walletId: string
  ): Promise<Array<WalletAddress>> => {
    const addresses = await this._getAddressesAllRequest(walletId);
    return addresses || [];
  };

  _getAddressesAllRequest = (
    walletId: string
  ): CachedRequest<Array<WalletAddress>> => {
    const foundRequest = find(this.addressesRequests, { walletId });
    if (foundRequest && foundRequest.allRequest) return foundRequest.allRequest;
    return new CachedRequest(this.api.bcc.getAddresses);
  };
}
