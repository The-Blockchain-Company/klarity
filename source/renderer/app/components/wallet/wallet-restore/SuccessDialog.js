// @flow
import React, { Component } from 'react';
import { defineMessages, FormattedHTMLMessage, intlShape } from 'react-intl';
import SVGInline from 'react-svg-inline';
import WalletRestoreDialog from './widgets/WalletRestoreDialog';
import tadaImage from '../../../assets/images/tada-ic.inline.svg';
import styles from './SuccessDialog.scss';
import type {
  WalletKlarityKind,
  WalletQuantaverseKind,
} from '../../../types/walletRestoreTypes';
import {
  WALLET_KLARITY_KINDS,
  WALLET_QUANTAVERSE_KINDS,
} from '../../../config/walletRestoreConfig';

const messages = defineMessages({
  closeButtonLabel: {
    id: 'wallet.restore.dialog.step.success.dialog.close',
    defaultMessage: '!!!Close',
    description:
      'Label for Close button on the wallet restore "success" step dialog.',
  },
  descriptionLine1: {
    id: 'wallet.restore.dialog.step.success.dialog.description.line1',
    defaultMessage: '!!!Your wallet has been successfully restored.',
    description:
      'Description "line 1" on the wallet restore "success" step dialog.',
  },
  descriptionLine2: {
    id: 'wallet.restore.dialog.step.success.dialog.description.line2',
    defaultMessage:
      '!!!Restored wallets should have all the funds and transaction history of the original wallet. <strong>If your restored wallet does not have the funds and transaction history you were expecting</strong>, please check that you have the correct wallet recovery phrase for the wallet you were intending to restore.',
    description:
      'Description "line 2" on the wallet restore "success" step dialog.',
  },
  descriptionLine3: {
    id: 'wallet.restore.dialog.step.success.dialog.description.line3',
    defaultMessage:
      '!!!<strong>If your restored wallet is empty, but you were expecting it to have funds</strong>, please check that you used the correct wallet recovery phrase during the restoration process.',
    description:
      'Description "line 3" on the wallet restore "success" step dialog.',
  },
});

type Props = {
  onClose: Function,
  walletKindKlarity: ?WalletKlarityKind,
  walletKindQuantaverse: ?WalletQuantaverseKind,
};

export default class SuccessDialog extends Component<Props> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  render() {
    const { intl } = this.context;
    const { onClose, walletKindKlarity, walletKindQuantaverse } = this.props;

    const isKlarityBalanceWallet =
      walletKindKlarity === WALLET_KLARITY_KINDS.COLE_12_WORD ||
      walletKindKlarity === WALLET_KLARITY_KINDS.COLE_27_WORD;
    const isKlarityRewardsWallet =
      walletKindKlarity === WALLET_KLARITY_KINDS.SOPHIE_15_WORD;
    const isQuantaverseBalanceWallet =
      walletKindQuantaverse === WALLET_QUANTAVERSE_KINDS.COLE_15_WORD;
    const isQuantaverseRewardsWallet =
      walletKindQuantaverse === WALLET_QUANTAVERSE_KINDS.SOPHIE_15_WORD;

    return (
      <WalletRestoreDialog
        actions={[
          {
            primary: true,
            label: intl.formatMessage(messages.closeButtonLabel),
            onClick: onClose,
          },
        ]}
        onClose={onClose}
      >
        <div className={styles.content}>
          <SVGInline svg={tadaImage} className={styles.tadaImage} />
          <div className={styles.description1}>
            <FormattedHTMLMessage {...messages.descriptionLine1} />
          </div>
          {(isKlarityRewardsWallet || isQuantaverseRewardsWallet) && (
            <div className={styles.description2}>
              <FormattedHTMLMessage {...messages.descriptionLine2} />
            </div>
          )}
          {(isKlarityBalanceWallet || isQuantaverseBalanceWallet) && (
            <div className={styles.description3}>
              <FormattedHTMLMessage {...messages.descriptionLine3} />
            </div>
          )}
        </div>
      </WalletRestoreDialog>
    );
  }
}
