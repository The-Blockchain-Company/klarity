// @flow
import type { RequestConfig } from '../../common/types';
import type { BccWallet, WalletInitData } from '../types';
import { request } from '../../utils/request';

export const createWallet = (
  config: RequestConfig,
  { walletInitData }: { walletInitData: WalletInitData }
): Promise<BccWallet> =>
  request(
    {
      method: 'POST',
      path: '/v2/wallets',
      ...config,
    },
    {},
    walletInitData
  );
