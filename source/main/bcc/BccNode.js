// @flow
import Store from 'electron-store';
import { spawn, exec } from 'child_process';
import type { ChildProcess } from 'child_process';
import type { WriteStream } from 'fs';
import type { Launcher } from 'bcc-launcher';
import { get, toInteger } from 'lodash';
import moment from 'moment';
import rfs from 'rotating-file-stream';
import { environment } from '../environment';
import {
  deriveProcessNames,
  deriveStorageKeys,
  promisedCondition,
} from './utils';
import { getProcess } from '../utils/processes';
import { safeExitWithCode } from '../utils/safeExitWithCode';
import type {
  BccNodeImplementations,
  BccNodeState,
  BccStatus,
  FaultInjection,
  FaultInjectionIpcRequest,
  FaultInjectionIpcResponse,
  TlsConfig,
} from '../../common/types/bcc-node.types';
import { BccNodeStates } from '../../common/types/bcc-node.types';
import { BccWalletLauncher } from './BccWalletLauncher';
import { BccSelfnodeLauncher } from './BccSelfnodeLauncher';
import { launcherConfig } from '../config';
import type { NodeConfig } from '../config';
import type { Logger } from '../../common/types/logging.types';

/* eslint-disable consistent-return */

type Actions = {
  spawn: typeof spawn,
  exec: typeof exec,
  readFileSync: (path: string) => Buffer,
  createWriteStream: (path: string, options?: Object) => WriteStream,
  broadcastTlsConfig: (config: ?TlsConfig) => void,
  broadcastStateChange: (state: BccNodeState) => void,
};

type StateTransitions = {
  onStarting: () => void,
  onRunning: () => void,
  onStopping: () => void,
  onStopped: () => void,
  onUpdating: () => void,
  onUpdated: () => void,
  onCrashed: (code: number, signal: string) => void,
  onError: (code: number, signal: string) => void,
  onUnrecoverable: () => void,
};

type BccNodeIpcMessage = {
  Started?: Array<any>,
  ReplyPort?: number,
  FInjects?: FaultInjectionIpcResponse,
};

export type BccNodeConfig = {
  stateDir: string, // Path to the state directory
  nodeImplementation: BccNodeImplementations,
  nodeConfig: NodeConfig,
  logFilePath: string, // Log file path for bcc-sl
  tlsPath: string, // Path to bcc-node TLS folder
  startupTimeout: number, // Milliseconds to wait for bcc-node to startup
  startupMaxRetries: number, // Maximum number of retries for re-starting then ode
  shutdownTimeout: number, // Milliseconds to wait for bcc-node to gracefully shutdown
  killTimeout: number, // Milliseconds to wait for bcc-node to be killed
  updateTimeout: number, // Milliseconds to wait for bcc-node to update itself
  cluster: string,
  configPath: string,
  syncTolerance: string,
  cliBin: string, // Path to bcc-cli executable
  isStaging: boolean,
  metadataUrl?: string,
};

const BCC_UPDATE_EXIT_CODE = 20;
// grab the current network on which Klarity is running
const network = String(environment.network);
const platform = String(environment.platform);
const { nodeImplementation } = launcherConfig;
const { isSelfnode } = environment;
// derive storage keys based on current network
const { PREVIOUS_BCC_PID } = deriveStorageKeys(network);
// derive Bcc process name based on current platform and node implementation
const { BCC_PROCESS_NAME } = deriveProcessNames(
  platform,
  nodeImplementation,
  isSelfnode
);
// create store for persisting BccNode and Klarity PID's in fs
const store = new Store();

export class BccNode {
  /**
   * The config used to spawn bcc-node
   * @private
   */
  _config: BccNodeConfig;

  /**
   * The managed bcc-node child process
   * @private
   */
  _node: ?Launcher;

  /**
   * The ipc channel used for broadcasting messages to the outside world
   * @private
   */
  _actions: Actions;

  /**
   * The ipc channel used for broadcasting messages to the outside world
   * @private
   */
  _transitionListeners: StateTransitions;

  /**
   * logger instance to print debug messages to
   * @private
   */
  _log: Logger;

  /**
   * Log file stream for bcc-node
   * @private
   */
  _bccNodeLogFile: WriteStream;

  /**
   * Log file stream for bcc-wallet
   * @private
   */
  _bccWalletLogFile: WriteStream;

  /**
   * The TLS config that is generated by the bcc-node
   * on each startup and is broadcasted over ipc channel
   * @private
   */
  _tlsConfig: ?TlsConfig = null;

  /**
   * The current state of the node, used for making decisions
   * when events like process crashes happen.
   *
   * @type {BccNodeState}
   * @private
   */
  _state: BccNodeState = BccNodeStates.STOPPED;

  /**
   * The last saved status of bcc node, acting as a cache for the
   * frontend to enable faster page reloads.
   *
   * @type {BccStatus}
   * @private
   */
  _status: ?BccStatus = null;

  /**
   * Number of retries to startup the node (without ever reaching running state)
   */
  _startupTries: number = 0;

  /**
   * Flag which makes bcc node to exit Klarity after stopping
   */
  _exitOnStop: boolean = false;

  /**
   * All faults that have been injected and confirmed by bcc-node.
   * These faults can be used during testing to trigger faulty behavior
   * that would not be testable with a correctly working node.
   *
   * @type {Array}
   * @private
   */
  _injectedFaults: Array<FaultInjection> = [];

  /**
   * Bcc Node config getter
   * @returns {BccNodeImplementations}
   */
  get config(): BccNodeConfig {
    return this._config;
  }

  /**
   * Getter which copies and returns the internal tls config.
   * @returns {TlsConfig}
   */
  get tlsConfig(): TlsConfig {
    return Object.assign({}, this._tlsConfig);
  }

  /**
   * Getter which returns the PID of the child process of bcc-node
   * @returns {TlsConfig} // I think this returns a number...
   */
  get pid(): ?number {
    return get(this, '_node.pid', null);
  }

  /**
   * Getter for the current internal state of the node.
   * @returns {BccNodeState}
   */
  get state(): BccNodeState {
    return this._state;
  }

  /**
   * Getter for the cached status of the node.
   * @returns {BccStatus}
   */
  get status(): ?BccStatus {
    return Object.assign({}, this._status, {
      bccNodePID: get(this, '_node.pid', 0),
      bccWalletPID: get(this, '_node.wpid', 0),
    });
  }

  /**
   * Getter for the number of tried (and failed) startups
   * @returns {number}
   */
  get startupTries(): number {
    return this._startupTries;
  }

  /**
   * Constructs and prepares the BccNode instance for life.
   * @param log
   * @param actions
   * @param transitions
   */
  constructor(log: Logger, actions: Actions, transitions: StateTransitions) {
    this._log = log;
    this._actions = actions;
    this._transitionListeners = transitions;
  }

  /**
   * Starts bcc-node as child process with given config and log file stream.
   * Waits up to `startupTimeout` for the process to connect.
   * Registers ipc listeners for any necessary process lifecycle events.
   * Asks the node to reply with the current port.
   * Transitions into STARTING state.
   *
   * @param config {BccNodeConfig}
   * @param isForced {boolean}
   * @returns {Promise<void>} resolves if the node could be started, rejects with error otherwise.
   */
  start = async (
    config: BccNodeConfig,
    isForced: boolean = false
  ): Promise<void> => {
    const { _log } = this;

    // Guards
    const nodeCanBeStarted = await this._canBeStarted();

    if (!nodeCanBeStarted) {
      _log.error('BccNode#start: Cannot be started', {
        startupTries: this._startupTries,
      });
      return Promise.reject(new Error('BccNode: Cannot be started'));
    }
    if (this._isUnrecoverable(config) && !isForced) {
      _log.error('BccNode#start: Too many startup retries', {
        startupTries: this._startupTries,
      });
      return Promise.reject(new Error('BccNode: Too many startup retries'));
    }

    // Setup
    const {
      // startupTimeout,
      nodeConfig,
      stateDir,
      cluster,
      tlsPath,
      configPath,
      syncTolerance,
      cliBin,
      isStaging,
      metadataUrl,
    } = config;

    this._config = config;

    this._startupTries++;
    this._changeToState(BccNodeStates.STARTING);
    _log.info(
      `BccNode#start: trying to start bcc-node for the ${this._startupTries} time`,
      { startupTries: this._startupTries }
    );

    return new Promise(async (resolve, reject) => {
      const nodeLogFile = rfs(
        (time) => {
          // The module works by writing to the one file name before it is rotated out.
          if (!time) return 'node.log';
          const timestamp = moment.utc().format('YYYYMMDDHHmmss');
          return `node.log-${timestamp}`;
        },
        {
          size: '5M',
          path: config.logFilePath,
          maxFiles: 4,
        }
      );
      this._bccNodeLogFile = nodeLogFile;

      const walletLogFile = rfs(
        (time) => {
          // The module works by writing to the one file name before it is rotated out.
          if (!time) return 'bcc-wallet.log';
          const timestamp = moment.utc().format('YYYYMMDDHHmmss');
          return `bcc-wallet.log-${timestamp}`;
        },
        {
          size: '5M',
          path: config.logFilePath,
          maxFiles: 4,
        }
      );
      this._bccWalletLogFile = walletLogFile;

      if (isSelfnode) {
        try {
          const { selfnodeBin, mockTokenMetadataServerBin } = launcherConfig;
          const { node, replyPort } = await BccSelfnodeLauncher({
            selfnodeBin,
            mockTokenMetadataServerBin,
            processName: BCC_PROCESS_NAME,
            onStop: this._ensureProcessIsNotRunning,
          });
          _log.info(
            `BccNode#start: bcc-node child process spawned with PID ${node.pid}`,
            { pid: node.pid }
          );
          this._node = node;
          this._handleBccNodeMessage({ ReplyPort: replyPort });
          resolve();
        } catch (error) {
          _log.error(
            'BccNode#start: Unable to initialize bcc-launcher',
            { error }
          );
          const { code, signal } = error || {};
          this._handleBccNodeError(code, signal);
          reject(
            new Error(
              'BccNode#start: Unable to initialize bcc-launcher'
            )
          );
        }
      } else {
        try {
          const node = await BccWalletLauncher({
            nodeImplementation,
            nodeConfig,
            cluster,
            stateDir,
            tlsPath,
            configPath,
            syncTolerance,
            nodeLogFile,
            walletLogFile,
            cliBin,
            isStaging,
            metadataUrl,
          });

          this._node = node;

          _log.info('Starting bcc-node now...');

          _log.info(`Current working directory is: ${process.cwd()}`, {
            cwd: process.cwd(),
          });

          // await promisedCondition(() => node.connected, startupTimeout);

          node
            .start()
            .then((api) => {
              const processes: {
                wallet: ChildProcess,
                node: ChildProcess,
              } = {
                wallet: node.walletService.getProcess(),
                node: node.nodeService.getProcess(),
              };

              // Setup event handling
              node.walletBackend.events.on('exit', (exitStatus) => {
                _log.info('BccNode#exit', { exitStatus });
                const { code, signal } = exitStatus.wallet;
                this._handleBccNodeExit(code, signal);
              });

              node.pid = processes.node.pid;
              node.wpid = processes.wallet.pid;
              node.connected = true; // TODO: use processes.wallet.connected here
              _log.info(
                `BccNode#start: bcc-node child process spawned with PID ${processes.node.pid}`,
                { pid: processes.node.pid }
              );
              _log.info(
                `BccNode#start: bcc-wallet child process spawned with PID ${processes.wallet.pid}`,
                { pid: processes.wallet.pid }
              );
              this._handleBccNodeMessage({
                ReplyPort: api.requestParams.port,
              });
              resolve();
            })
            .catch((exitStatus) => {
              _log.error(
                'BccNode#start: Error while spawning bcc-node',
                {
                  exitStatus,
                }
              );
              const { code, signal } = exitStatus.wallet || {};
              this._handleBccNodeError(code, signal);
              reject(
                new Error(
                  'BccNode#start: Error while spawning bcc-node'
                )
              );
            });
        } catch (error) {
          _log.error(
            'BccNode#start: Unable to initialize bcc-launcher',
            {
              error,
            }
          );
          const { code, signal } = error || {};
          this._handleBccNodeError(code, signal);
          reject(
            new Error(
              'BccNode#start: Unable to initialize bcc-launcher'
            )
          );
        }
      }
    });
  };

  /**
   * Stops bcc-node, first by stopping and waiting up to `shutdownTimeout`
   * for the node to shutdown itself properly. If that doesn't work as expected the
   * node is killed.
   *
   * @returns {Promise<void>} resolves if the node could be stopped, rejects with error otherwise.
   */
  async stop(): Promise<void> {
    const { _node, _log, _config } = this;
    if (await this._isDead()) {
      _log.info('BccNode#stop: process is not running anymore');
      return Promise.resolve();
    }
    _log.info('BccNode#stop: stopping bcc-node process');
    try {
      this._changeToState(BccNodeStates.STOPPING);
      if (_node) await _node.stop(_config.shutdownTimeout / 1000);
      await this._waitForNodeProcessToExit(_config.shutdownTimeout);
      await this._storeProcessStates();
      this._reset();
      return Promise.resolve();
    } catch (error) {
      _log.error('BccNode#stop: bcc-node did not stop correctly', {
        error,
      });
      try {
        await this.kill();
      } catch (killError) {
        return Promise.reject(killError);
      }
    }
  }

  /**
   * Kills bcc-node and waitsup to `killTimeout` for the node to
   * report the exit message.
   *
   * @returns {Promise<void>} resolves if the node could be killed, rejects with error otherwise.
   */
  kill(): Promise<void> {
    const { _node, _log } = this;
    return new Promise(async (resolve, reject) => {
      if (await this._isDead()) {
        _log.info('BccNode#kill: process is already dead');
        return Promise.resolve();
      }
      try {
        _log.info('BccNode#kill: killing bcc-node process');
        if (_node) _node.kill();
        await this._waitForBccToExitOrKillIt();
        await this._storeProcessStates();
        this._changeToState(BccNodeStates.STOPPED);
        this._reset();
        resolve();
      } catch (_) {
        _log.info('BccNode#kill: could not kill bcc-node');
        await this._storeProcessStates();
        this._reset();
        reject(new Error('Could not kill bcc-node.'));
      }
    });
  }

  /**
   * Stops bcc-node if necessary and starts it again with current config.
   * Optionally the restart can be forced, so that the `maxRestartTries` is ignored.
   *
   * @param isForced {boolean}
   * @returns {Promise<void>} resolves if the node could be restarted, rejects with error otherwise.
   */
  async restart(isForced: boolean = false): Promise<void> {
    const { _log, _config } = this;
    try {
      // Stop bcc nicely if it is still awake
      if (this._isConnected()) {
        _log.info('BccNode#restart: stopping current node');
        await this.stop();
      }
      _log.info('BccNode#restart: restarting node with previous config', {
        isForced,
      });
      await this._waitForBccToExitOrKillIt();
      if (this._exitOnStop) {
        _log.info('Klarity:safeExit: exiting Klarity with code 0', {
          code: 0,
        });
        safeExitWithCode(0);
      } else {
        await this.start(_config, isForced);
      }
    } catch (error) {
      _log.error('BccNode#restart: Could not restart bcc-node', {
        error,
      });
      if (this._state !== BccNodeStates.UNRECOVERABLE) {
        this._changeToState(BccNodeStates.ERRORED);
      }
      return Promise.reject(error);
    }
  }

  /**
   * Uses the configured action to broadcast the tls config
   */
  broadcastTlsConfig() {
    this._actions.broadcastTlsConfig(this._tlsConfig);
  }

  /**
   * Changes the internal state to UPDATING.
   * Waits up to the configured `updateTimeout` for the UPDATED state.
   * Kills bcc-node if it didn't properly update.
   *
   * @returns {Promise<void>} resolves if the node updated, rejects with error otherwise.
   */
  async expectNodeUpdate(): Promise<void> {
    const { _log, _config } = this;
    this._changeToState(BccNodeStates.UPDATING);
    _log.info('BccNode: waiting for node to apply update');
    try {
      await promisedCondition(
        () => this._state === BccNodeStates.UPDATED,
        _config.updateTimeout
      );
      await this._waitForNodeProcessToExit(_config.updateTimeout);
    } catch (error) {
      _log.info('BccNode: did not apply update as expected, killing it...');
      return this.kill();
    }
  }

  /**
   * Sends an ipc message to bcc-node to inject a specific fault.
   * This is useful for testing certain error cases that cannot be tested
   * with a properly working bcc-node.
   *
   * Returns a promise that resolves as soon as bcc-node confirmed the injection.
   *
   * @param request
   * @returns {Promise<void>}
   */
  setFault = async (request: FaultInjectionIpcRequest) => {
    if (!this._node) return;
    const fault = request[0];
    const isEnabled = request[1];
    this._node.send({ SetFInject: request });
    try {
      return await promisedCondition(() => {
        const hasFault = this._injectedFaults.includes(fault);
        return isEnabled ? hasFault : !hasFault;
      });
    } catch (error) {
      return Promise.reject(
        new Error(`bcc-node did not inject the fault "${fault}" correctly.`)
      );
    }
  };

  saveStatus(status: ?BccStatus) {
    this._status = status;
  }

  /**
   * Signals the bcc-node to exit Klarity on stop
   */
  exitOnStop = () => {
    this._exitOnStop = true;
  };

  // ================================= PRIVATE ===================================
  /**
   * Handles node ipc messages sent by the bcc-node process.
   * Updates the tls config where possible and broadcasts it to
   * the outside if it is complete. Transitions into RUNNING state
   * after it broadcasted the tls config (that's the difference between
   * STARTING and RUNNING).
   *
   * @param msg
   * @private
   */
  _handleBccNodeMessage = (msg: BccNodeIpcMessage) => {
    if (msg == null) return;
    this._log.info('BccNode: received message', { msg });
    if (msg.ReplyPort != null)
      this._handleBccReplyPortMessage(msg.ReplyPort);
    if (msg.FInjects != null)
      this._handleBccFaultInjectionResponse(msg.FInjects);
  };

  /**
   * Reads the tls certificates and uses them together with the given port
   * to set the tls config, which will be used for any http communication
   * with the node.
   *
   * Changes state to RUNNING.
   *
   * @param port
   * @private
   */
  _handleBccReplyPortMessage = (port: number) => {
    const { _actions } = this;
    const { tlsPath } = this._config;
    this._tlsConfig = environment.isSelfnode
      ? {
          ca: ('': any),
          key: ('': any),
          cert: ('': any),
          hostname: 'localhost',
          port,
        }
      : {
          ca: _actions.readFileSync(`${tlsPath}/client/ca.crt`),
          key: _actions.readFileSync(`${tlsPath}/client/client.key`),
          cert: _actions.readFileSync(`${tlsPath}/client/client.pem`),
          hostname: 'localhost',
          port,
        };

    if (this._state === BccNodeStates.STARTING) {
      this._changeToState(BccNodeStates.RUNNING);
      this.broadcastTlsConfig();
      // Reset the startup tries when we managed to get the node running
      this._startupTries = 0;
    }
  };

  /**
   * Updates the active, injected faults confirmed by bcc-node.
   * @param response
   * @private
   */
  _handleBccFaultInjectionResponse = (
    response: FaultInjectionIpcResponse
  ) => {
    this._log.info('BccNode: the following injected faults are active', {
      injectedFaults: response,
    });
    this._injectedFaults = response;
  };

  _handleBccNodeError = async (code: number, signal: string) => {
    const { _log, _config } = this;
    _log.error('BccNode: error', { code, signal });
    if (this._isUnrecoverable(_config)) {
      this._changeToState(BccNodeStates.UNRECOVERABLE);
    } else {
      this._changeToState(BccNodeStates.ERRORED);
      this._transitionListeners.onError(code, signal);
      await this.restart();
    }
  };

  _handleBccNodeExit = async (code: number, signal: string) => {
    const { _log, _config, _node } = this;
    _log.info('BccNode exited', { code, signal });
    // We don't know yet what happened but we can be sure bcc-node is exiting
    if (this._state === BccNodeStates.RUNNING) {
      this._changeToState(BccNodeStates.EXITING);
    }
    try {
      // Before proceeding with exit procedures, wait until the node is really dead.
      await this._waitForNodeProcessToExit(_config.shutdownTimeout);
    } catch (_) {
      _log.error(
        `BccNode: sent exit code ${code} but was still running after ${_config.shutdownTimeout}ms. Killing it now.`,
        { code, shutdownTimeout: _config.shutdownTimeout }
      );
      try {
        if (_node)
          await this._ensureProcessIsNotRunning(
            _node.pid,
            BCC_PROCESS_NAME
          );
      } catch (e) {
        _log.info('BccNode: did not exit correctly');
      }
    }
    _log.info('BccNode: process really exited', { code, signal });
    // Handle various exit scenarios
    if (this._state === BccNodeStates.STOPPING) {
      this._changeToState(BccNodeStates.STOPPED);
    } else if (
      this._state === BccNodeStates.UPDATING &&
      code === BCC_UPDATE_EXIT_CODE
    ) {
      this._changeToState(BccNodeStates.UPDATED);
    } else if (this._isUnrecoverable(_config)) {
      this._changeToState(BccNodeStates.UNRECOVERABLE);
    } else {
      this._changeToState(BccNodeStates.CRASHED, code, signal);
    }
    await this._storeProcessStates();
    this._reset();
  };

  _reset = () => {
    if (this._bccNodeLogFile) this._bccNodeLogFile.end();
    if (this._bccWalletLogFile) this._bccWalletLogFile.end();
    if (this._node) this._node = null;
    this._tlsConfig = null;
  };

  _changeToState(state: BccNodeState, ...args: Array<any>) {
    const { _log, _transitionListeners } = this;
    _log.info(`BccNode: transitions to <${state}>`, { state });
    this._state = state;
    this._actions.broadcastStateChange(state);
    switch (state) {
      case BccNodeStates.STARTING:
        return _transitionListeners.onStarting();
      case BccNodeStates.RUNNING:
        return _transitionListeners.onRunning();
      case BccNodeStates.STOPPING:
        return _transitionListeners.onStopping();
      case BccNodeStates.STOPPED:
        return _transitionListeners.onStopped();
      case BccNodeStates.UPDATING:
        return _transitionListeners.onUpdating();
      case BccNodeStates.UPDATED:
        return _transitionListeners.onUpdated();
      case BccNodeStates.CRASHED:
        return _transitionListeners.onCrashed(...args);
      case BccNodeStates.UNRECOVERABLE:
        return _transitionListeners.onUnrecoverable();
      default:
    }
  }

  /**
   * Checks if bcc-node child_process is connected and can be interacted with
   * @returns {boolean}
   */
  _isConnected = (): boolean => this._node != null && this._node.connected;

  /**
   * Checks if bcc-node child_process is not running anymore
   * @returns {boolean}
   */
  _isDead = async (): Promise<boolean> =>
    !this._isConnected() && this._isNodeProcessNotRunningAnymore();

  /**
   * Checks if current bcc-node child_process is "awake" (created, connected, stateful)
   * If node is already awake, returns false.
   * Kills process with PID that matches PID of the previously running
   * bcc-node child_process that didn't shut down properly
   * @returns {boolean}
   * @private
   */
  _canBeStarted = async (): Promise<boolean> => {
    if (this._isConnected()) {
      return false;
    }
    try {
      await this._ensurePreviousBccNodeIsNotRunning();
      return true;
    } catch (error) {
      return false;
    }
  };

  _ensureProcessIsNotRunning = async (pid: number, name: string) => {
    const { _log } = this;
    _log.info(
      `BccNode: checking if ${name} process (PID: ${pid}) is still running`,
      { name, pid }
    );
    if (await this._isProcessRunning(pid, name)) {
      _log.info(`BccNode: killing ${name} process (PID: ${pid})`, {
        name,
        pid,
      });
      try {
        await this._killProcessWithName(pid, name);
        return Promise.resolve();
      } catch (error) {
        _log.error(
          `BccNode: could not kill ${name} process (PID: ${pid})`,
          { name, pid, error }
        );
        return Promise.reject();
      }
    }
    this._log.info(`BccNode: no ${name} process (PID: ${pid}) is running`, {
      name,
      pid,
    });
  };

  _ensureCurrentBccNodeIsNotRunning = async (): Promise<void> => {
    const { _log, _node } = this;
    _log.info(
      'BccNode: checking if current bcc-node process is still running'
    );
    if (_node == null) {
      return Promise.resolve();
    }
    return this._ensureProcessIsNotRunning(_node.pid, BCC_PROCESS_NAME);
  };

  _ensurePreviousBccNodeIsNotRunning = async (): Promise<void> => {
    const { _log } = this;
    const previousPID: ?number = await this._retrieveData(PREVIOUS_BCC_PID);
    _log.info(
      'BccNode: checking if previous bcc-node process is still running',
      { previousPID }
    );
    if (previousPID == null) {
      return Promise.resolve();
    }
    return this._ensureProcessIsNotRunning(previousPID, BCC_PROCESS_NAME);
  };

  _isProcessRunning = async (
    previousPID: number,
    processName: string
  ): Promise<boolean> => {
    const { _log } = this;
    try {
      const previousProcess = await getProcess(previousPID, processName);
      if (!previousProcess) {
        _log.info(
          `BccNode: No previous ${processName} process is running anymore`,
          { processName }
        );
        return false;
      }
      _log.info(`BccNode: previous ${processName} process found`, {
        processName,
        previousProcess,
      });
      return true;
    } catch (error) {
      _log.error('BccNode: _isProcessRunning error', { error });
      return false;
    }
  };

  // kills running process which did not shut down properly between sessions
  _killProcessWithName = async (pid: number, name: string): Promise<void> => {
    const { _config } = this;
    try {
      if (!environment.isWindows) {
        this._log.info(`BccNode: using "process.kill(${pid})" to kill it`, {
          pid,
        });
        process.kill(pid);
      } else {
        // https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill
        const windowsKillCmd = `taskkill /pid ${pid} /t /f`;
        this._log.info('BccNode (Windows): using kill command to kill it', {
          windowsKillCmd,
        });
        this._actions.exec(windowsKillCmd);
      }
      await promisedCondition(
        async () => (await this._isProcessRunning(pid, name)) === false,
        _config.killTimeout
      );

      this._log.info(
        `BccNode: successfully killed ${name} process (PID: ${pid})`,
        { name, pid }
      );
      return Promise.resolve();
    } catch (error) {
      this._log.error(
        `BccNode: _killProcessWithName returned an error attempting to kill ${name} process (PID: ${pid})`,
        { processName: name, pid, error }
      );
      return Promise.reject(error);
    }
  };

  async _storeProcessStates() {
    const { _log } = this;
    if (this._node != null) {
      const { pid } = this._node;
      _log.info('BccNode: storing last bcc-node PID', { pid });
      await this._storeData(PREVIOUS_BCC_PID, pid);
    }
  }

  // stores the current port/pid on which bcc-node or Klarity is running
  _storeData = (identifier: string, data: number): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        // saves current port/pid in file system
        store.set(identifier, data);
        this._log.info(`BccNode: ${identifier} stored successfully`);
        resolve();
      } catch (error) {
        this._log.error(`BccNode: failed to store ${identifier}`, {
          error,
        });
        reject(error);
      }
    });

  // retrieves the last known port/pid on which bcc-node or Klarity was running
  _retrieveData = (identifier: string): Promise<?number> =>
    new Promise((resolve, reject) => {
      try {
        // retrieves previous port/pid from file system
        const data: ?number = store.get(identifier);

        if (!data) {
          this._log.info(`BccNode: get ${identifier} returned null`);
          resolve(null);
        }

        this._log.info(`BccNode: get ${identifier} success`, {
          [`${identifier}`]: data,
        });
        resolve(toInteger(data));
      } catch (error) {
        this._log.error(`BccNode: get ${identifier} failed`, { error });
        reject(error);
      }
    });

  _isNodeProcessStillRunning = async (): Promise<boolean> =>
    this._node != null &&
    this._isProcessRunning(this._node.pid, BCC_PROCESS_NAME);

  _isNodeProcessNotRunningAnymore = async () =>
    (await this._isNodeProcessStillRunning()) === false;

  _waitForNodeProcessToExit = async (timeout: number) =>
    promisedCondition(this._isNodeProcessNotRunningAnymore, timeout);

  _waitForBccToExitOrKillIt = async () => {
    const { _config } = this;
    if (this._isNodeProcessNotRunningAnymore()) return Promise.resolve();
    try {
      await this._waitForNodeProcessToExit(_config.shutdownTimeout);
    } catch (_) {
      await this._ensureCurrentBccNodeIsNotRunning();
    }
  };

  _isUnrecoverable = (config: BccNodeConfig) =>
    this._startupTries >= config.startupMaxRetries;
}
