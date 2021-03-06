// @flow
import React, { Component } from 'react';
import { defineMessages, intlShape } from 'react-intl';
import DialogCloseButton from '../../widgets/DialogCloseButton';
import Dialog from '../../widgets/Dialog';
import styles from './TransferFundsStep1Dialog.scss';
import Wallet from '../../../domains/Wallet';
import WalletsDropdown from '../../widgets/forms/WalletsDropdown';
import ItemDropdownOption from '../../widgets/forms/ItemDropdownOption';
import { formattedWalletAmount } from '../../../utils/formatters';
import globalMessages from '../../../i18n/global-messages';
import LocalizableError from '../../../i18n/LocalizableError';

const messages = defineMessages({
  dialogTitle: {
    id: 'wallet.transferFunds.dialog1.title',
    defaultMessage: '!!!Transfer funds',
    description: 'Title  in the transfer funds form.',
  },
  sourceWallet: {
    id: 'wallet.transferFunds.dialog1.sourceWallet',
    defaultMessage: '!!!From Cole legacy wallet',
    description: 'sourceWallet in the transfer funds form.',
  },
  targetWallet: {
    id: 'wallet.transferFunds.dialog1.targetWallet',
    defaultMessage: '!!!To Sophie-compatible wallet',
    description: 'targetWallet in the transfer funds form.',
  },
  buttonLabel: {
    id: 'wallet.transferFunds.dialog1.continueLabel',
    defaultMessage: '!!!Continue',
    description: 'buttonLabel in the transfer funds form.',
  },
});

type Props = {
  onClose: Function,
  onContinue: Function,
  onSetSourceWallet: Function,
  targetWalletId: string,
  sourceWallet: $Shape<Wallet>,
  wallets: Array<$Shape<Wallet>>,
  numberOfStakePools: number,
  getStakePoolById: Function,
  isSubmitting: boolean,
  error: ?LocalizableError,
};

export default class TransferFundsStep1Dialog extends Component<Props> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  render() {
    const { intl } = this.context;
    const {
      onClose,
      onContinue,
      onSetSourceWallet,
      targetWalletId,
      sourceWallet,
      wallets,
      numberOfStakePools,
      getStakePoolById,
      isSubmitting,
      error,
    } = this.props;

    const onClick = error ? onClose : onContinue;

    return (
      <Dialog
        title={intl.formatMessage(messages.dialogTitle)}
        actions={[
          {
            className: isSubmitting ? styles.isSubmitting : null,
            label: intl.formatMessage(
              error ? globalMessages.close : messages.buttonLabel
            ),
            onClick: !isSubmitting ? onClick : () => null,
            primary: true,
            disabled: isSubmitting || !this.props.targetWalletId,
          },
        ]}
        closeOnOverlayClick
        onClose={onClose}
        closeButton={<DialogCloseButton />}
      >
        <p className={styles.label}>
          {intl.formatMessage(messages.sourceWallet)}
        </p>
        <div className={styles.sourceWallet}>
          <ItemDropdownOption
            label={sourceWallet.name}
            detail={formattedWalletAmount(sourceWallet.amount)}
            selected
          />
        </div>
        <WalletsDropdown
          label={intl.formatMessage(messages.targetWallet)}
          wallets={wallets}
          onChange={onSetSourceWallet}
          value={targetWalletId}
          numberOfStakePools={numberOfStakePools}
          getStakePoolById={getStakePoolById}
        />
        {error && <p className={styles.error}>{intl.formatMessage(error)}</p>}
      </Dialog>
    );
  }
}
