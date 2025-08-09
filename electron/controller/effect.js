'use strict';

const { dialog } = require('electron');
const { getMainWindow } = require('ee-core/electron');

/**
 * effect - demo
 * @class
 */
class EffectController {

  /**
   * select file
   */
  selectFile() {
    const filePaths = dialog.showOpenDialogSync({
      properties: ['openFile']
    });

    if (!filePaths) {
      return null
    }

    return filePaths[0];
  }

  /**
   * 设置登录窗口
   */
  loginWindow(args) {
    const { width, height } = args;
    const win = getMainWindow();
    
    // 如果窗口已最大化，先还原窗口
    if (win.isMaximized()) {
      win.unmaximize();
    }
    
    const size = {
      width: width || 400,
      height: height || 300
    }
    
    win.setSize(size.width, size.height);
    win.setResizable(true);
    win.center();
    win.show();
    win.focus();
  }
  
  /**
   * restore window
   */
  restoreWindow(args) {
    const { width, height } = args;
    const win = getMainWindow();

    const size = {
      width: width || 980,
      height: height || 650
    }
    win.setSize(size.width, size.height);
    win.setResizable(true);
    win.center();
    win.show();
    win.focus();
  }

  /**
   * 最小化窗口
   */
  windowMinimize() {
    const win = getMainWindow();
    if (win) {
      win.minimize();
    }
  }

  /**
   * 切换最大化/还原窗口
   */
  windowToggleMaximize() {
    const win = getMainWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  }

  /**
   * 关闭窗口
   */
  windowClose() {
    const win = getMainWindow();
    if (win) {
      win.close();
    }
  }

  /**
   * 检查窗口是否最大化
   */
  windowIsMaximized() {
    const win = getMainWindow();
    return win ? win.isMaximized() : false;
  }

  /**
   * 获取窗口位置和大小
   */
  getWindowBounds() {
    const win = getMainWindow();
    return win ? win.getBounds() : null;
  }

  /**
   * 设置窗口位置
   */
  setWindowPosition(args) {
    const { x, y } = args;
    const win = getMainWindow();
    if (win && typeof x === 'number' && typeof y === 'number') {
      // 清除之前的延迟调用
      if (this._moveTimeout) {
        clearTimeout(this._moveTimeout);
      }
      
      // 使用 setImmediate 确保在下一个事件循环中执行，减少抖动
      this._moveTimeout = setImmediate(() => {
        try {
          const roundedX = Math.round(x);
          const roundedY = Math.round(y);
          
          // 检查位置是否真的需要改变
          const currentBounds = win.getBounds();
          if (currentBounds.x !== roundedX || currentBounds.y !== roundedY) {
            win.setPosition(roundedX, roundedY);
          }
        } catch (error) {
          console.warn('设置窗口位置失败:', error);
        }
        this._moveTimeout = null;
      });
    }
  }
}
EffectController.toString = () => '[class EffectController]';

module.exports = EffectController;  