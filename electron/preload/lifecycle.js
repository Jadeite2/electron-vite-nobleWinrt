'use strict';

const { logger } = require('ee-core/log');
const { getConfig } = require('ee-core/config');
const { getMainWindow } = require('ee-core/electron');
const { globalShortcut } = require('electron');

class Lifecycle {

  /**
   * core app have been loaded
   */
  async ready() {
    logger.info('[lifecycle] ready');
  }

  /**
   * electron app ready
   */
  async electronAppReady() {
    logger.info('[lifecycle] electron-app-ready');
  }

  /**
   * main window have been loaded
   */
  async windowReady() {
    logger.info('[lifecycle] window-ready');
    // 延迟加载，无白屏
    const { windowsOption } = getConfig();
    if (windowsOption.show == false) {
      const win = getMainWindow();
      win.once('ready-to-show', () => {
        win.show();
        win.focus();
      })
    }

    // 注册开发者工具快捷键
    const win = getMainWindow();
    
    // F12 打开/关闭开发者工具
    globalShortcut.register('F12', () => {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    });

    // Ctrl+Shift+I 打开/关闭开发者工具 (Windows/Linux)
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    });

    logger.info('[lifecycle] 开发者工具快捷键已注册: F12, Ctrl+Shift+I');
  }

  /**
   * before app close
   */  
  async beforeClose() {
    logger.info('[lifecycle] before-close');
    // 取消注册所有快捷键
    globalShortcut.unregisterAll();
  }
}
Lifecycle.toString = () => '[class Lifecycle]';

module.exports = {
  Lifecycle
};