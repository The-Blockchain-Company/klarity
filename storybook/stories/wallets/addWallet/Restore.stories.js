// @flow
import React from 'react';
import { action } from '@storybook/addon-actions';
import { select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import { WALLET_RECOVERY_PHRASE_WORD_COUNT } from '../../../../source/renderer/app/config/cryptoConfig';

// Helpers
import WalletsWrapper from '../_utils/WalletsWrapper';
import {
  WALLET_KINDS,
  WALLET_KLARITY_KINDS,
  WALLET_QUANTAVERSE_KINDS,
  WALLET_HARDWARE_KINDS,
} from '../../../../source/renderer/app/config/walletRestoreConfig';

// Screens
import WalletTypeDialog from '../../../../source/renderer/app/components/wallet/wallet-restore/WalletTypeDialog';
import MnemonicsDialog from '../../../../source/renderer/app/components/wallet/wallet-restore/MnemonicsDialog';
import ConfigurationDialog from '../../../../source/renderer/app/components/wallet/wallet-restore/ConfigurationDialog';
import SuccessDialog from '../../../../source/renderer/app/components/wallet/wallet-restore/SuccessDialog';

type Props = {
  locale: string,
};

storiesOf('Wallets|Add Wallet', module)
  .addDecorator(WalletsWrapper)
  .add('Restore - Step 1', () => {
    const walletKindSelect = select(
      'Wallet Kind',
      { '-': null, ...WALLET_KINDS },
      null
    );
    let selectItems;
    if (walletKindSelect === WALLET_KINDS.QUANTAVERSE)
      selectItems = WALLET_QUANTAVERSE_KINDS;
    else if (walletKindSelect === WALLET_KINDS.HARDWARE)
      selectItems = WALLET_HARDWARE_KINDS;
    else selectItems = WALLET_KLARITY_KINDS;
    let walletKindSpecificSelect;
    if (walletKindSelect)
      walletKindSpecificSelect = select(
        `Wallet Kind - ${walletKindSelect || 'Klarity'}`,
        {
          '-': null,
          ...selectItems,
        },
        null
      );

    return (
      <WalletTypeDialog
        onContinue={action('onContinue')}
        onClose={action('onClose')}
        onSetWalletKind={action('onSetWalletKind')}
        walletKind={walletKindSelect}
        walletKindKlarity={walletKindSpecificSelect}
        walletKindQuantaverse={walletKindSpecificSelect}
        walletKindHardware={walletKindSpecificSelect}
      />
    );
  })
  .add('Restore - Step 2', () => {
    const walletKindSelect = select(
      'Wallet Kind',
      WALLET_KINDS,
      WALLET_KINDS.KLARITY
    );
    let selectItems;
    if (walletKindSelect === WALLET_KINDS.QUANTAVERSE)
      selectItems = WALLET_QUANTAVERSE_KINDS;
    else if (walletKindSelect === WALLET_KINDS.HARDWARE)
      selectItems = WALLET_HARDWARE_KINDS;
    else selectItems = WALLET_KLARITY_KINDS;

    let walletKindSpecificSelect;
    if (walletKindSelect)
      walletKindSpecificSelect = select(
        `Wallet Kind - ${walletKindSelect || 'Klarity'}`,
        selectItems,
        Object.values(WALLET_KLARITY_KINDS)[0]
      );

    return (
      <MnemonicsDialog
        onContinue={action('onContinue')}
        onClose={action('onClose')}
        onSetWalletKind={action('onSetWalletKind')}
        onBack={action('onSetWalletKind')}
        onSetWalletMnemonics={action('onSetWalletMnemonics')}
        walletKind={walletKindSelect}
        walletKindKlarity={walletKindSpecificSelect}
        walletKindQuantaverse={walletKindSpecificSelect}
        walletKindHardware={walletKindSpecificSelect}
        mnemonics={[]}
        expectedWordCount={WALLET_RECOVERY_PHRASE_WORD_COUNT}
        maxWordCount={WALLET_RECOVERY_PHRASE_WORD_COUNT}
        onValidateMnemonics={action('onValidateMnemonics')}
      />
    );
  })
  .add('Restore - Step 3', (props: Props) => {
    const { locale } = props;
    return (
      <ConfigurationDialog
        isSubmitting={false}
        onContinue={action('onContinue')}
        onClose={action('onClose')}
        onBack={action('onSetWalletKind')}
        onChange={action('onSetWalletKind')}
        repeatPassword=""
        spendingPassword=""
        walletName=""
        currentLocale={locale}
      />
    );
  })
  .add('Restore - Step 4', () => {
    const walletKindSelect = select(
      'Wallet Kind',
      WALLET_KINDS,
      WALLET_KINDS.KLARITY
    );
    let selectItems;
    if (walletKindSelect === WALLET_KINDS.QUANTAVERSE)
      selectItems = WALLET_QUANTAVERSE_KINDS;
    else if (walletKindSelect === WALLET_KINDS.HARDWARE)
      selectItems = WALLET_HARDWARE_KINDS;
    else selectItems = WALLET_KLARITY_KINDS;

    let walletKindSpecificSelect;
    if (walletKindSelect)
      walletKindSpecificSelect = select(
        `Wallet Kind - ${walletKindSelect || 'Klarity'}`,
        selectItems,
        Object.values(WALLET_KLARITY_KINDS)[0]
      );
    return (
      <SuccessDialog
        onClose={action('onClose')}
        walletKindKlarity={walletKindSpecificSelect}
        walletKindQuantaverse={walletKindSpecificSelect}
      />
    );
  });
