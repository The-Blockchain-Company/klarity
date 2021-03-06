// @flow
import React, { Component } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import { defineMessages, intlShape } from 'react-intl';
import styles from './DisplaySettings.scss';
import themeIncentivizedTestnetPreview from '../../../assets/images/themes/incentivized-testnet.png';
import themeBccPreview from '../../../assets/images/themes/bcc.png';
import themeDarkBluePreview from '../../../assets/images/themes/dark-blue.png';
import themeDarkBccPreview from '../../../assets/images/themes/dark-bcc.png';
import themeFlightCandidatePreview from '../../../assets/images/themes/flight-candidate.png';
import themeLightBluePreview from '../../../assets/images/themes/light-blue.png';
import themeSophieTestnetPreview from '../../../assets/images/themes/sophie-testnet.png';
import themeYellowPreview from '../../../assets/images/themes/yellow.png';
import themeWhitePreview from '../../../assets/images/themes/white.png';
import { THEMES } from '../../../themes/index';

const messages = defineMessages({
  themeLabel: {
    id: 'settings.display.themeLabel',
    defaultMessage: '!!!Theme',
    description:
      'Label for the "Theme" selection on the display settings page.',
  },
  themeIncentivizedTestnet: {
    id: 'settings.display.themeNames.incentivizedTestnet',
    defaultMessage: '!!!Incentivized Testnet',
    description:
      'Name of the "Incentivized Testnet" theme on the display settings page.',
  },
  themeLightBlue: {
    id: 'settings.display.themeNames.lightBlue',
    defaultMessage: '!!!Light blue',
    description: 'Name of the "Light blue" theme on the display settings page.',
  },
  themeBcc: {
    id: 'settings.display.themeNames.bcc',
    defaultMessage: '!!!Bcc',
    description: 'Name of the "Bcc" theme on the display settings page.',
  },
  themeDarkBlue: {
    id: 'settings.display.themeNames.darkBlue',
    defaultMessage: '!!!Dark blue',
    description: 'Name of the "Dark blue" theme on the display settings page.',
  },
  themeDarkBcc: {
    id: 'settings.display.themeNames.darkBcc',
    defaultMessage: '!!!Dark Bcc',
    description:
      'Name of the "Dark bcc" theme on the display settings page.',
  },
  themeFlightCandidate: {
    id: 'settings.display.themeNames.flightCandidate',
    defaultMessage: '!!!Flight Candidate',
    description:
      'Name of the "Flight Candidate" theme on the display settings page.',
  },
  themeSophieTestnet: {
    id: 'settings.display.themeNames.sophieTestnet',
    defaultMessage: '!!!Sophie Testnet',
    description:
      'Name of the "Sophie Testnet" theme on the display settings page.',
  },
  themeYellow: {
    id: 'settings.display.themeNames.yellow',
    defaultMessage: '!!!Yellow',
    description: 'Name of the "Yellow" theme on the display settings page.',
  },
  themeWhite: {
    id: 'settings.display.themeNames.white',
    defaultMessage: '!!!White',
    description: 'Name of the "White" theme on the display settings page.',
  },
});

type Props = {
  theme: string,
  selectTheme: Function,
};

@observer
export default class DisplaySettings extends Component<Props> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  render() {
    const { theme, selectTheme } = this.props;
    const { intl } = this.context;
    const { isFlight, environment } = global;
    const { isDev } = environment;

    const themeIncentivizedTestnetClasses = classnames([
      theme === THEMES.INCENTIVIZED_TESTNET ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeLightBlueClasses = classnames([
      theme === THEMES.LIGHT_BLUE ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeBccClasses = classnames([
      theme === THEMES.BCC ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeDarkBlueClasses = classnames([
      theme === THEMES.DARK_BLUE ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeDarkBccClasses = classnames([
      theme === THEMES.DARK_BCC ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeFlightCandidateClasses = classnames([
      theme === THEMES.FLIGHT_CANDIDATE ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeSophieTestnetClasses = classnames([
      theme === THEMES.SOPHIE_TESTNET ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeYellowClasses = classnames([
      theme === THEMES.YELLOW ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    const themeWhiteClasses = classnames([
      theme === THEMES.WHITE ? styles.active : styles.inactive,
      styles.themeImageWrapper,
    ]);

    return (
      <div className={styles.component}>
        <div className={styles.label}>
          {intl.formatMessage(messages.themeLabel)}
        </div>

        <div className={styles.themesRowWrapper}>
          <button
            className={themeLightBlueClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.LIGHT_BLUE })}
          >
            <img
              src={themeLightBluePreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeLightBlue)}</span>
          </button>

          <button
            className={themeBccClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.BCC })}
          >
            <img
              src={themeBccPreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeBcc)}</span>
          </button>

          <button
            className={themeWhiteClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.WHITE })}
          >
            <img
              src={themeWhitePreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeWhite)}</span>
          </button>
        </div>

        <div className={styles.themesRowWrapper}>
          <button
            className={themeDarkBlueClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.DARK_BLUE })}
          >
            <img
              src={themeDarkBluePreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeDarkBlue)}</span>
          </button>

          <button
            className={themeDarkBccClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.DARK_BCC })}
          >
            <img
              src={themeDarkBccPreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeDarkBcc)}</span>
          </button>

          <button
            className={themeYellowClasses}
            onClick={selectTheme.bind(this, { theme: THEMES.YELLOW })}
          >
            <img
              src={themeYellowPreview}
              role="presentation"
              draggable="false"
            />
            <span>{intl.formatMessage(messages.themeYellow)}</span>
          </button>
        </div>

        <div className={styles.themesRowWrapper}>
          {isDev && (
            <button
              className={themeIncentivizedTestnetClasses}
              onClick={selectTheme.bind(this, {
                theme: THEMES.INCENTIVIZED_TESTNET,
              })}
            >
              <img
                src={themeIncentivizedTestnetPreview}
                role="presentation"
                draggable="false"
              />
              <span>
                {intl.formatMessage(messages.themeIncentivizedTestnet)}
              </span>
            </button>
          )}

          {(isDev || isFlight) && (
            <button
              className={themeFlightCandidateClasses}
              onClick={selectTheme.bind(this, {
                theme: THEMES.FLIGHT_CANDIDATE,
              })}
            >
              <img
                src={themeFlightCandidatePreview}
                role="presentation"
                draggable="false"
              />
              <span>{intl.formatMessage(messages.themeFlightCandidate)}</span>
            </button>
          )}

          {isDev && (
            <button
              className={themeSophieTestnetClasses}
              onClick={selectTheme.bind(this, {
                theme: THEMES.SOPHIE_TESTNET,
              })}
            >
              <img
                src={themeSophieTestnetPreview}
                role="presentation"
                draggable="false"
              />
              <span>{intl.formatMessage(messages.themeSophieTestnet)}</span>
            </button>
          )}
        </div>
      </div>
    );
  }
}
