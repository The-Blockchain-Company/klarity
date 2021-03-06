// @flow
import {
  WALLET_RECOVERY_PHRASE_WORD_COUNT,
  PAPER_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  LEGACY_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  QUANTAVERSE_WALLET_RECOVERY_PHRASE_WORD_COUNT,
} from './cryptoConfig';

export const CREATE_WALLET_STEPS = [
  'instructions',
  'template',
  'mnemonics',
  'validate',
  'hashImage',
  'config',
];

export const WALLET_RESTORE_TYPES = {
  REGULAR: 'regular', // Sophie wallet
  CERTIFICATE: 'certificate', // Paper wallet
  LEGACY: 'legacy', // Cole wallet
  QUANTAVERSE_REGULAR: 'quantaverse-regular', // Quantaverse regular (rewards) wallet
  QUANTAVERSE_LEGACY: 'quantaverse-legacy', // Quantaverse legacy (balance) wallet
};

export const RECOVERY_PHRASE_WORD_COUNT_OPTIONS = {
  [WALLET_RESTORE_TYPES.REGULAR]: WALLET_RECOVERY_PHRASE_WORD_COUNT,
  [WALLET_RESTORE_TYPES.CERTIFICATE]: PAPER_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  [WALLET_RESTORE_TYPES.LEGACY]: LEGACY_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  [WALLET_RESTORE_TYPES.QUANTAVERSE_REGULAR]: QUANTAVERSE_WALLET_RECOVERY_PHRASE_WORD_COUNT,
  [WALLET_RESTORE_TYPES.QUANTAVERSE_LEGACY]: QUANTAVERSE_WALLET_RECOVERY_PHRASE_WORD_COUNT,
};

export const WALLET_PUBLIC_KEY_NOTIFICATION_SEGMENT_LENGTH = 15;
export const IS_WALLET_PUBLIC_KEY_SHARING_ENABLED = true;
export const IS_ICO_PUBLIC_KEY_SHARING_ENABLED = true;

export const WALLET_PUBLIC_KEY_DERIVATION_PATH = "M/1852'/1815'/0'";
export const ICO_PUBLIC_KEY_DERIVATION_PATH = "M/1854'/1815'/0'";

// Automatic wallet migration from pre Klarity 1.0.0 versions has been disabled
export const IS_AUTOMATIC_WALLET_MIGRATION_ENABLED = false;

// Wallet assets feature toggle enable/disable
export const WALLET_ASSETS_ENABLED = true;

// Cole wallet migration has been temporarily disabled due to missing Api support after Jen HF
export const IS_COLE_WALLET_MIGRATION_ENABLED = false;

export const IS_WALLET_UNDELEGATION_ENABLED = false;

export const TRANSACTION_MIN_BCC_VALUE = 1;
