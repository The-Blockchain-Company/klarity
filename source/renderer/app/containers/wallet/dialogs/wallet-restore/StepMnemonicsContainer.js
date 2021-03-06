// @flow
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import MnemonicsDialog from '../../../../components/wallet/wallet-restore/MnemonicsDialog';
import type { InjectedDialogContainerStepProps } from '../../../../types/injectedPropsType';
import { InjectedDialogContainerStepDefaultProps } from '../../../../types/injectedPropsType';
import { isValidMnemonic } from '../../../../../../common/config/crypto/decrypt';
import {
  getScrambledInput,
  unscramblePaperWalletMnemonic,
} from '../../../../utils/crypto';

import {
  WALLET_KINDS,
  WALLET_KLARITY_WORD_COUNT,
  WALLET_QUANTAVERSE_WORD_COUNT,
  WALLET_HARDWARE_WORD_COUNT,
} from '../../../../config/walletRestoreConfig';
import {
  PAPER_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  LEGACY_WALLET_RECOVERY_PHRASE_WORD_COUNT,
} from '../../../../config/cryptoConfig';
import type {
  WalletKind,
  WalletKlarityKind,
  WalletQuantaverseKind,
  WalletHardwareKind,
} from '../../../../types/walletRestoreTypes';

type Props = InjectedDialogContainerStepProps;
const DefaultProps = InjectedDialogContainerStepDefaultProps;

@inject('stores', 'actions')
@observer
export default class MnemonicsDialogContainer extends Component<Props> {
  static defaultProps = DefaultProps;

  handleSetWalletMnemonics = (mnemonics: Array<string>) =>
    this.props.actions.wallets.restoreWalletSetMnemonics.trigger({ mnemonics });

  handleValidateMnemonics = (mnemonics: Array<string>): boolean => {
    let enteredWords = mnemonics;
    let numberOfWords = mnemonics.length;
    const {
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware,
    } = this.props.stores.wallets;
    const expectedWordCount = this.getExpectedWordCount(
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware
    );
    if (expectedWordCount === PAPER_WALLET_RECOVERY_PHRASE_WORD_COUNT) {
      numberOfWords = LEGACY_WALLET_RECOVERY_PHRASE_WORD_COUNT;
      const { passphrase, scrambledInput } = getScrambledInput(mnemonics);
      try {
        enteredWords = unscramblePaperWalletMnemonic(
          passphrase,
          scrambledInput
        );
      } catch (e) {
        return false;
      }
    }
    return isValidMnemonic(enteredWords.join(' '), numberOfWords);
  };

  getExpectedWordCount = (
    walletKind: ?WalletKind,
    walletKindKlarity: ?WalletKlarityKind,
    walletKindQuantaverse: ?WalletQuantaverseKind,
    walletKindHardware: ?WalletHardwareKind
  ): Array<number> | number => {
    let expectedWordCount = 0;
    if (walletKindKlarity && walletKind === WALLET_KINDS.KLARITY) {
      expectedWordCount = WALLET_KLARITY_WORD_COUNT[walletKindKlarity];
    } else if (walletKindQuantaverse && walletKind === WALLET_KINDS.QUANTAVERSE) {
      expectedWordCount = WALLET_QUANTAVERSE_WORD_COUNT[walletKindQuantaverse];
    } else if (walletKindHardware) {
      expectedWordCount = WALLET_HARDWARE_WORD_COUNT[walletKindHardware];
    }
    return expectedWordCount;
  };

  getMaxWordCount = (expectedWordCount: Array<number> | number): number =>
    Array.isArray(expectedWordCount)
      ? Math.max(...expectedWordCount)
      : expectedWordCount;

  render() {
    const { onContinue, onClose, onBack, stores } = this.props;
    const {
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware,
      mnemonics,
    } = stores.wallets;
    const expectedWordCount = this.getExpectedWordCount(
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware
    );
    const maxWordCount = this.getMaxWordCount(expectedWordCount);
    return (
      <MnemonicsDialog
        onClose={onClose}
        onContinue={onContinue}
        onBack={onBack}
        onValidateMnemonics={this.handleValidateMnemonics}
        walletKind={walletKind}
        walletKindKlarity={walletKindKlarity}
        walletKindQuantaverse={walletKindQuantaverse}
        walletKindHardware={walletKindHardware}
        onSetWalletMnemonics={this.handleSetWalletMnemonics}
        mnemonics={mnemonics}
        expectedWordCount={expectedWordCount}
        maxWordCount={maxWordCount}
      />
    );
  }
}
