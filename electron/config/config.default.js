'use strict';

const path = require('path');
const { getBaseDir } = require('ee-core/ps');
/**
 * 默认配置
 */
module.exports = () => {
  return {
    openDevTools: false,
    singleLock: true, // 只能打开一个应用实例
    autoHideMenuBar: true,
    windowsOption: {
      title: 'ble-test',
      width: 969,
      // height: 486, //自定义标题栏的时候
      height: 495,
      minWidth: 400,
      minHeight: 300,
      // frame: false, // 无边框窗口，支持自定义标题栏拖拽
      webPreferences: {
        //webSecurity: false,
        contextIsolation: false, // false -> 可在渲染进程中使用electron的api，true->需要bridge.js(contextBridge)
        nodeIntegration: true,
        webBluetooth: true,
        //preload: path.join(getElectronDir(), 'preload', 'bridge.js'),
      },
      show: false,
      icon: path.join(getBaseDir(), 'public', 'images', 'logo-32.png')
      // ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})
    },
    logger: {
      level: 'INFO',
      outputJSON: false,
      appLogName: 'ee.log',
      coreLogName: 'ee-core.log',
      errorLogName: 'ee-error.log',
      encoding: 'utf8',
      consoleLevel: 'INFO'
    },
    remote: {
      enable: false,
      url: 'http://electron-egg.kaka996.com/'
    },
    socketServer: {
      enable: false,
      port: 7070,
      path: "/socket.io/",
      connectTimeout: 45000,
      pingTimeout: 30000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8,
      transports: ["polling", "websocket"],
      cors: {
        origin: true,
      },
      channel: 'socket-channel'
    },
    httpServer: {
      enable: false,
      https: {
        enable: false, 
        key: '/public/ssl/localhost+1.key',
        cert: '/public/ssl/localhost+1.pem'
      },
      host: '127.0.0.1',
      port: 7071,
    },
    mainServer: {
      indexPath: '/public/dist/index.html',
      channelSeparator: '/',
    }
  }
}
