// @flow
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import StatusIcons from './StatusIcons';
import ReportIssue from './ReportIssue';
import LogosDisplay from './LogosDisplay';
import SyncingConnectingBackground from './SyncingConnectingBackground';
import SyncingConnectingStatus from './SyncingConnectingStatus';
import { BccNodeStates } from '../../../../../common/types/bcc-node.types';
import styles from './SyncingConnecting.scss';
import type { BccNodeState } from '../../../../../common/types/bcc-node.types';
import { REPORT_ISSUE_TIME_TRIGGER } from '../../../config/timingConfig';
import NewsFeedIcon from '../../widgets/NewsFeedIcon';

let connectingInterval = null;

type State = {
  connectingTime: number,
};

type Props = {
  bccNodeState: ?BccNodeState,
  verificationProgress: number,
  hasBeenConnected: boolean,
  forceConnectivityIssue?: boolean,
  isConnected: boolean,
  isSynced: boolean,
  isConnecting: boolean,
  isSyncing: boolean,
  isSyncProgressStalling: boolean,
  isNodeStopping: boolean,
  isNodeStopped: boolean,
  isTlsCertInvalid: boolean,
  hasLoadedCurrentLocale: boolean,
  hasLoadedCurrentTheme: boolean,
  hasNotification: boolean,
  hasUpdate: boolean,
  isCheckingSystemTime: boolean,
  isNodeResponding: boolean,
  isNodeSyncing: boolean,
  isNodeTimeCorrect: boolean,
  disableDownloadLogs: boolean,
  showNewsFeedIcon: boolean,
  isVerifyingBlockchain: boolean,
  onIssueClick: Function,
  onOpenExternalLink: Function,
  onDownloadLogs: Function,
  onStatusIconClick: Function,
  onToggleNewsFeedIconClick: Function,
};

@observer
export default class SyncingConnecting extends Component<Props, State> {
  state = {
    connectingTime: 0,
  };

  componentDidMount() {
    const { isConnected, isVerifyingBlockchain } = this.props;
    this._defensivelyStartTimers(isConnected, isVerifyingBlockchain);
  }

  componentDidUpdate() {
    const { isConnected, isVerifyingBlockchain } = this.props;
    const canResetConnecting = this._connectingTimerShouldStop(
      isConnected,
      isVerifyingBlockchain
    );

    this._defensivelyStartTimers(isConnected, isVerifyingBlockchain);
    if (canResetConnecting) {
      this._resetConnectingTime();
    }
  }

  componentWillUnmount() {
    this._resetConnectingTime();
  }

  _connectingTimerShouldStart = (
    isConnected: boolean,
    isVerifyingBlockchain: boolean
  ): boolean =>
    !isConnected && !isVerifyingBlockchain && connectingInterval === null;

  _connectingTimerShouldStop = (
    isConnected: boolean,
    isVerifyingBlockchain: boolean
  ): boolean =>
    (isConnected || isVerifyingBlockchain) && connectingInterval !== null;

  _defensivelyStartTimers = (
    isConnected: boolean,
    isVerifyingBlockchain: boolean
  ) => {
    const needConnectingTimer = this._connectingTimerShouldStart(
      isConnected,
      isVerifyingBlockchain
    );
    if (needConnectingTimer) {
      connectingInterval = setInterval(this._incrementConnectingTime, 1000);
    }
  };

  _resetConnectingTime = () => {
    if (connectingInterval !== null) {
      clearInterval(connectingInterval);
      connectingInterval = null;
    }
    this.setState({ connectingTime: 0 });
  };

  _incrementConnectingTime = () => {
    this.setState((prevState) => ({
      connectingTime: prevState.connectingTime + 1,
    }));
  };

  get showReportIssue() {
    const {
      isConnected,
      isSyncProgressStalling,
      bccNodeState,
      forceConnectivityIssue,
      isVerifyingBlockchain,
    } = this.props;
    const { connectingTime } = this.state;
    const canReportConnectingIssue =
      !isVerifyingBlockchain &&
      (isSyncProgressStalling ||
        forceConnectivityIssue ||
        (!isConnected &&
          (connectingTime >= REPORT_ISSUE_TIME_TRIGGER ||
            bccNodeState === BccNodeStates.UNRECOVERABLE)));
    return canReportConnectingIssue;
  }

  render() {
    const {
      bccNodeState,
      isConnected,
      isSynced,
      isConnecting,
      isSyncing,
      hasLoadedCurrentLocale,
      hasLoadedCurrentTheme,
      hasNotification,
      hasUpdate,
      onIssueClick,
      onOpenExternalLink,
      onDownloadLogs,
      disableDownloadLogs,
      isNodeResponding,
      isNodeSyncing,
      isNodeTimeCorrect,
      isCheckingSystemTime,
      hasBeenConnected,
      isTlsCertInvalid,
      isNodeStopping,
      isNodeStopped,
      onStatusIconClick,
      onToggleNewsFeedIconClick,
      showNewsFeedIcon,
      isVerifyingBlockchain,
      verificationProgress,
    } = this.props;

    const newsFeedIconStyles = classNames([
      isConnecting ? 'connectingScreen' : null,
      isSyncing || isSynced ? 'syncingScreen' : null,
    ]);

    return (
      <div className={styles.component}>
        <SyncingConnectingBackground
          hasLoadedCurrentTheme={hasLoadedCurrentTheme}
          isConnecting={isConnecting}
          isSyncing={isSyncing}
        />
        <div className={styles.content}>
          {this.showReportIssue && (
            <ReportIssue
              onIssueClick={onIssueClick}
              onOpenExternalLink={onOpenExternalLink}
              onDownloadLogs={onDownloadLogs}
              disableDownloadLogs={disableDownloadLogs}
            />
          )}
          {showNewsFeedIcon && (
            <NewsFeedIcon
              onNewsFeedIconClick={onToggleNewsFeedIconClick}
              newsFeedIconClass={newsFeedIconStyles}
              hasNotification={hasNotification}
              hasUpdate={hasUpdate}
            />
          )}
          <LogosDisplay isConnected={isConnected} />
        </div>
        <SyncingConnectingStatus
          bccNodeState={bccNodeState}
          hasLoadedCurrentLocale={hasLoadedCurrentLocale}
          hasBeenConnected={hasBeenConnected}
          isTlsCertInvalid={isTlsCertInvalid}
          isConnected={isConnected}
          isNodeStopping={isNodeStopping}
          isNodeStopped={isNodeStopped}
          isVerifyingBlockchain={isVerifyingBlockchain}
          verificationProgress={verificationProgress}
        />
        <StatusIcons
          onIconClick={onStatusIconClick}
          nodeState={bccNodeState}
          isNodeResponding={isNodeResponding}
          isNodeTimeCorrect={
            isCheckingSystemTime ? undefined : isNodeTimeCorrect
          }
          isNodeSyncing={isNodeSyncing}
        />
      </div>
    );
  }
}
