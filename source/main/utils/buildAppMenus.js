// @flow
import { app, globalShortcut, Menu, BrowserWindow, dialog } from 'electron';
import { environment } from '../environment';
import { winLinuxMenu } from '../menus/win-linux';
import { osxMenu } from '../menus/osx';
import { logger } from './logging';
import { safeExitWithCode } from './safeExitWithCode';
import { BccNode } from '../bcc/BccNode';
import { DIALOGS, PAGES } from '../../common/ipc/constants';
import { showUiPartChannel } from '../ipc/control-ui-parts';
import { getTranslation } from './getTranslation';

export const buildAppMenus = async (
  mainWindow: BrowserWindow,
  bccNode: ?BccNode,
  locale: string,
  data: {
    isNavigationEnabled: boolean,
  }
) => {
  const { ABOUT, KLARITY_DIAGNOSTICS, ITN_REWARDS_REDEMPTION } = DIALOGS;
  const { SETTINGS, WALLET_SETTINGS } = PAGES;
  const { isNavigationEnabled } = data;

  const { isMacOS, isBlankScreenFixActive } = environment;
  const translations = require(`../locales/${locale}`);

  const openAboutDialog = () => {
    if (mainWindow) showUiPartChannel.send(ABOUT, mainWindow);
  };

  const openKlarityDiagnosticsDialog = () => {
    if (mainWindow) showUiPartChannel.send(KLARITY_DIAGNOSTICS, mainWindow);
  };

  const openItnRewardsRedemptionDialog = () => {
    if (mainWindow) showUiPartChannel.send(ITN_REWARDS_REDEMPTION, mainWindow);
  };

  const openSettingsPage = () => {
    if (mainWindow) showUiPartChannel.send(SETTINGS, mainWindow);
  };

  const openWalletSettingsPage = () => {
    if (mainWindow) showUiPartChannel.send(WALLET_SETTINGS, mainWindow);
  };

  const restartWithBlankScreenFix = async () => {
    logger.info('Restarting in BlankScreenFix...');
    if (bccNode) await bccNode.stop();
    logger.info('Exiting Klarity with code 21', { code: 21 });
    safeExitWithCode(21);
  };

  const restartWithoutBlankScreenFix = async () => {
    logger.info('Restarting without BlankScreenFix...');
    if (bccNode) await bccNode.stop();
    logger.info('Exiting Klarity with code 22', { code: 22 });
    safeExitWithCode(22);
  };

  const toggleBlankScreenFix = async (item) => {
    const translation = getTranslation(translations, 'menu');
    const blankScreenFixDialogOptions = {
      buttons: [
        translation('helpSupport.blankScreenFixDialogConfirm'),
        translation('helpSupport.blankScreenFixDialogCancel'),
      ],
      type: 'warning',
      title: isBlankScreenFixActive
        ? translation('helpSupport.blankScreenFixDialogTitle')
        : translation('helpSupport.nonBlankScreenFixDialogTitle'),
      message: isBlankScreenFixActive
        ? translation('helpSupport.blankScreenFixDialogMessage')
        : translation('helpSupport.nonBlankScreenFixDialogMessage'),
      defaultId: 1,
      cancelId: 1,
      noLink: true,
    };

    const { response } = await dialog.showMessageBox(
      mainWindow,
      blankScreenFixDialogOptions
    );
    if (response === 0) {
      if (isBlankScreenFixActive) {
        restartWithoutBlankScreenFix();
      } else {
        restartWithBlankScreenFix();
      }
    }
    item.checked = isBlankScreenFixActive;
  };

  const menuActions = {
    openAboutDialog,
    openKlarityDiagnosticsDialog,
    openItnRewardsRedemptionDialog,
    openSettingsPage,
    openWalletSettingsPage,
    toggleBlankScreenFix,
  };

  // Build app menus
  let menu;
  if (isMacOS) {
    menu = Menu.buildFromTemplate(
      osxMenu(
        app,
        mainWindow,
        menuActions,
        translations,
        locale,
        isNavigationEnabled
      )
    );
    Menu.setApplicationMenu(menu);
  } else {
    menu = Menu.buildFromTemplate(
      winLinuxMenu(
        app,
        mainWindow,
        menuActions,
        translations,
        locale,
        isNavigationEnabled
      )
    );
    mainWindow.setMenu(menu);
  }

  // Hide application window on Cmd+H hotkey (OSX only!)
  if (isMacOS) {
    app.on('activate', () => {
      if (!mainWindow.isVisible()) app.show();
    });

    mainWindow.on('focus', () => {
      globalShortcut.register('CommandOrControl+H', app.hide);
    });

    mainWindow.on('blur', () => {
      globalShortcut.unregister('CommandOrControl+H');
    });
  }
};
