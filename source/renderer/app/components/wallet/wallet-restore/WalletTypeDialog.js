// @flow
import React, { Component, Fragment } from 'react';
import { defineMessages, intlShape, FormattedHTMLMessage } from 'react-intl';
import { set } from 'lodash';
import { Checkbox } from 'react-polymorph/lib/components/Checkbox';
import { CheckboxSkin } from 'react-polymorph/lib/skins/simple/CheckboxSkin';
import RadioSet from '../../widgets/RadioSet';
import WalletRestoreDialog from './widgets/WalletRestoreDialog';
import globalMessages from '../../../i18n/global-messages';
import styles from './WalletTypeDialog.scss';
import {
  WALLET_KINDS,
  WALLET_KLARITY_KINDS,
  WALLET_QUANTAVERSE_KINDS,
  WALLET_HARDWARE_KINDS,
} from '../../../config/walletRestoreConfig';
import type {
  WalletKinds,
  WalletKind,
  WalletKlarityKind,
  WalletQuantaverseKind,
  WalletHardwareKind,
  HardwareWalletAcceptance,
} from '../../../types/walletRestoreTypes';

const messages = defineMessages({
  labelWalletKind: {
    id: 'wallet.restore.dialog.step.walletKind.label.walletKind',
    defaultMessage: '!!!What kind of wallet would you like to restore?',
    description: 'Label for the "labelwalletKind" checkbox.',
  },
  labelWalletKindKlarity: {
    id: 'wallet.restore.dialog.step.walletKind.label.walletKindKlarity',
    defaultMessage: '!!!Klarity wallet',
    description: 'Label for the "labelWalletKindKlarity" checkbox.',
  },
  labelWalletKindQuantaverse: {
    id: 'wallet.restore.dialog.step.walletKind.label.walletKindQuantaverse',
    defaultMessage: '!!!Quantaverse wallet',
    description: 'Label for the "labelWalletKindQuantaverse" checkbox.',
  },
  labelWalletKindHardware: {
    id: 'wallet.restore.dialog.step.walletKind.label.walletKindHardware',
    defaultMessage: '!!!Hardware wallet',
    description: 'Label for the "labelWalletKindHardware" checkbox.',
  },
  labelKlarityWalletKind: {
    id: 'wallet.restore.dialog.step.walletKind.label.klarityWalletKind',
    defaultMessage:
      '!!!What kind of Klarity wallet would you like to restore?',
    description: 'Label for the "labelKlarityWalletKind" checkbox.',
  },
  labelKlarityWalletKind12WordCole: {
    id:
      'wallet.restore.dialog.step.walletKind.label.klarityWalletKind12WordCole',
    defaultMessage: '!!!12 words <em>(Cole legacy wallet)</em>',
    description: 'Label for the "labelKlarityWalletKind12WordCole" checkbox.',
  },
  labelKlarityWalletKind15WordSophie: {
    id:
      'wallet.restore.dialog.step.walletKind.label.klarityWalletKind15WordSophie',
    defaultMessage:
      '!!!15 words <em>(Incentivized Testnet Rewards wallet)</em>',
    description:
      'Label for the "labelKlarityWalletKind15WordSophie" checkbox.',
  },
  labelKlarityWalletKind24WordSophie: {
    id:
      'wallet.restore.dialog.step.walletKind.label.klarityWalletKind24WordSophie',
    defaultMessage: '!!!24 words <em>(Sophie wallet)</em>',
    description:
      'Label for the "labelKlarityWalletKind24WordSophie" checkbox.',
  },
  labelKlarityWalletKind27WordPaper: {
    id:
      'wallet.restore.dialog.step.walletKind.label.klarityWalletKind27WordPaper',
    defaultMessage: '!!!27 words - paper wallet (Cole legacy wallet)</em>',
    description: 'Label for the "labelKlarityWalletKind27WordPaper" checkbox.',
  },
  labelQuantaverseWalletKind: {
    id: 'wallet.restore.dialog.step.walletKind.label.quantaverseWalletKind',
    defaultMessage: '!!!What kind of Quantaverse wallet would you like to restore?',
    description: 'Label for the "labelQuantaverseWalletKind" checkbox.',
  },
  labelQuantaverseWalletKind15WordCole: {
    id:
      'wallet.restore.dialog.step.walletKind.label.quantaverseWalletKindColeLegacy15Word',
    defaultMessage: '!!!15 words <em>(Cole legacy wallet)</em>',
    description: 'Label for the "labelKlarityWalletKind15WordCole" checkbox.',
  },
  labelQuantaverseWalletKind15WordSophie: {
    id:
      'wallet.restore.dialog.step.walletKind.label.quantaverseWalletKindSophie15Word',
    defaultMessage: '!!!15 words <em>(Sophie wallet)</em>',
    description:
      'Label for the "labelKlarityWalletKind15WordSophie" checkbox.',
  },
  labelHardwareWalletKind: {
    id: 'wallet.restore.dialog.step.walletKind.label.hardwareWalletKind',
    defaultMessage:
      '!!!What kind of hardware wallet would you like to restore?',
    description: 'Label for the "labelHardwareWalletKind" checkbox.',
  },
  labelHardwareWalletKindLedger: {
    id: 'wallet.restore.dialog.step.walletKind.label.hardwareWalletKindLedger',
    defaultMessage: '!!!24 words - Ledger (Cole legacy wallet)',
    description: 'Label for the "labelHardwareWalletKindLedger" checkbox.',
  },
  labelHardwareWalletKindTrezor: {
    id: 'wallet.restore.dialog.step.walletKind.label.hardwareWalletKindTrezor',
    defaultMessage: '!!!24 words - Trezor (Cole legacy wallet)',
    description: 'Label for the "labelHardwareWalletKindTrezor" checkbox.',
  },
  hardwareWalletDisclaimer1: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletDisclaimer1',
    defaultMessage:
      '!!!Hardware wallets store your private keys securely on a physical device so they are immune to common computer threats such as viruses and software bugs. Recovery phrases for hardware wallets should always be kept offline. By entering your hardware wallet recovery phrase in Klarity, you expose your hardware wallet private keys to the security risks associated with computers and software.',
    description: 'Label for the "hardwareWalletDisclaimer1" disclaimer.',
  },
  hardwareWalletDisclaimer2: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletDisclaimer2',
    defaultMessage:
      '!!!All of your assets held on your hardware wallet device are associated with the same wallet recovery phrase and its corresponding private key. If you hold assets other than bcc on your hardware wallet device, you expose all of those assets to security risks.',
    description: 'Label for the "hardwareWalletDisclaimer2" disclaimer.',
  },
  hardwareWalletDisclaimer3: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletDisclaimer3',
    defaultMessage:
      '!!!We strongly recommend that you delete the Cole legacy wallet that was restored from your hardware wallet once you have moved funds into a Sophie wallet.',
    description: 'Label for the "hardwareWalletDisclaimer3" disclaimer.',
  },
  hardwareWalletCheckbox1: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletCheckbox1',
    defaultMessage:
      '!!!I understand and accept responsibility for the security concerns of restoring a hardware wallet on a computer.',
    description: 'Label for the "hardwareWalletCheckbox1" disclaimer.',
  },
  hardwareWalletCheckbox2: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletCheckbox2',
    defaultMessage:
      '!!!I understand that I should delete the Cole legacy wallet I am restoring from a hardware wallet after moving funds to a Sophie wallet.',
    description: 'Label for the "hardwareWalletCheckbox2" disclaimer.',
  },
  hardwareWalletCheckbox3: {
    id: 'wallet.restore.dialog.step.walletKind.hardwareWalletCheckbox3',
    defaultMessage:
      '!!!I understand that I am exposing all of the assets that are stored on my hardware wallet device, and not just bcc, to security risks.',
    description: 'Label for the "hardwareWalletCheckbox2" disclaimer.',
  },
});

type Props = {
  onContinue: Function,
  onClose: Function,
  onSetWalletKind: Function,
  walletKind: ?WalletKind,
  walletKindKlarity: ?WalletKlarityKind,
  walletKindQuantaverse: ?WalletQuantaverseKind,
  walletKindHardware: ?WalletHardwareKind,
};

type State = {
  [key: HardwareWalletAcceptance]: boolean,
};

export default class WalletTypeDialog extends Component<Props, State> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  state = {
    hardwareWalletAcceptance1: false,
    hardwareWalletAcceptance2: false,
    hardwareWalletAcceptance3: false,
  };

  toggleAcceptance = (param: HardwareWalletAcceptance) =>
    this.setState((currentState) => set({}, param, !currentState[param]));

  getWalletKind = (
    kinds: Object,
    message: string,
    value: ?string,
    kindParam?: string
  ) => (
    <RadioSet
      label={this.context.intl.formatMessage(message)}
      items={Object.keys(kinds).map((key: string) => {
        const kind: WalletKinds = kinds[key];
        const messageParam = `label${kindParam || ''}WalletKind${kind}`;
        const msg = messages[messageParam];
        if (!msg) {
          throw new Error(`Missing ${messageParam} message`);
        }
        return {
          key: kind,
          disabled: false,
          label: <FormattedHTMLMessage {...msg} />,
          selected: value === kind,
          onChange: () => this.props.onSetWalletKind(kind, kindParam),
        };
      })}
      verticallyAligned
    />
  );

  get isDisabled() {
    const {
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware,
    } = this.props;
    const {
      hardwareWalletAcceptance1,
      hardwareWalletAcceptance2,
      hardwareWalletAcceptance3,
    } = this.state;
    if (!walletKind) return true;
    if (walletKind === WALLET_KINDS.KLARITY && !walletKindKlarity)
      return true;
    if (walletKind === WALLET_KINDS.QUANTAVERSE && !walletKindQuantaverse) return true;
    return (
      walletKind === WALLET_KINDS.HARDWARE &&
      (!walletKindHardware ||
        !hardwareWalletAcceptance1 ||
        !hardwareWalletAcceptance2 ||
        !hardwareWalletAcceptance3)
    );
  }

  render() {
    const { intl } = this.context;
    const {
      onClose,
      onContinue,
      walletKind,
      walletKindKlarity,
      walletKindQuantaverse,
      walletKindHardware,
    } = this.props;
    const {
      hardwareWalletAcceptance1,
      hardwareWalletAcceptance2,
      hardwareWalletAcceptance3,
    } = this.state;
    return (
      <WalletRestoreDialog
        stepNumber={0}
        actions={[
          {
            primary: true,
            label: intl.formatMessage(globalMessages.dialogButtonContinueLabel),
            onClick: onContinue,
            disabled: this.isDisabled,
          },
        ]}
        onClose={onClose}
      >
        <div className={styles.component}>
          {this.getWalletKind(
            WALLET_KINDS,
            messages.labelWalletKind,
            walletKind
          )}
        </div>
        <div>
          {walletKind === WALLET_KINDS.KLARITY &&
            this.getWalletKind(
              WALLET_KLARITY_KINDS,
              messages.labelKlarityWalletKind,
              walletKindKlarity,
              WALLET_KINDS.KLARITY
            )}
          {walletKind === WALLET_KINDS.QUANTAVERSE &&
            this.getWalletKind(
              WALLET_QUANTAVERSE_KINDS,
              messages.labelQuantaverseWalletKind,
              walletKindQuantaverse,
              WALLET_KINDS.QUANTAVERSE
            )}
          {walletKind === WALLET_KINDS.HARDWARE && (
            <Fragment>
              {this.getWalletKind(
                WALLET_HARDWARE_KINDS,
                messages.labelHardwareWalletKind,
                walletKindHardware,
                WALLET_KINDS.HARDWARE
              )}
              <p className={styles.hardwareWalletAcceptance}>
                {intl.formatMessage(messages.hardwareWalletDisclaimer1)}
              </p>
              <p className={styles.hardwareWalletAcceptance}>
                {intl.formatMessage(messages.hardwareWalletDisclaimer2)}
              </p>
              <p className={styles.hardwareWalletAcceptance}>
                <b>{intl.formatMessage(messages.hardwareWalletDisclaimer3)}</b>
              </p>
              <Checkbox
                className="walletSecurityRisk"
                label={intl.formatMessage(messages.hardwareWalletCheckbox3)}
                onChange={() =>
                  this.toggleAcceptance('hardwareWalletAcceptance3')
                }
                checked={hardwareWalletAcceptance3}
                skin={CheckboxSkin}
              />
              <Checkbox
                className="restoreSecurityNote"
                label={intl.formatMessage(messages.hardwareWalletCheckbox1)}
                onChange={() =>
                  this.toggleAcceptance('hardwareWalletAcceptance1')
                }
                checked={hardwareWalletAcceptance1}
                skin={CheckboxSkin}
              />
              <Checkbox
                className="walletDeleteNote"
                label={intl.formatMessage(messages.hardwareWalletCheckbox2)}
                onChange={() =>
                  this.toggleAcceptance('hardwareWalletAcceptance2')
                }
                checked={hardwareWalletAcceptance2}
                skin={CheckboxSkin}
              />
            </Fragment>
          )}
        </div>
      </WalletRestoreDialog>
    );
  }
}
