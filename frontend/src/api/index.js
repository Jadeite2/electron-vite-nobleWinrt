
/**
 * 主进程与渲染进程通信频道定义
 * Definition of communication channels between main process and rendering process
 */
const ipcApiRoute = {
  test: 'controller/example/test',
  // effect
  effect: {
    selectFile: 'controller/effect/selectFile',
    loginWindow: 'controller/effect/loginWindow',
    restoreWindow: 'controller/effect/restoreWindow',
    windowMinimize: 'controller/effect/windowMinimize',
    windowToggleMaximize: 'controller/effect/windowToggleMaximize',
    windowClose: 'controller/effect/windowClose',
    windowIsMaximized: 'controller/effect/windowIsMaximized',
  },
  // BLE相关路由
  ble: {
    getBluetoothState: 'controller/ble/getBluetoothState',
    startScan: 'controller/ble/startScan',
    stopScan: 'controller/ble/stopScan',
    getDevices: 'controller/ble/getDevices',
    connectDevice: 'controller/ble/connectDevice',
    disconnectDevice: 'controller/ble/disconnectDevice',
    readCharacteristic: 'controller/ble/readCharacteristic',
    writeCharacteristic: 'controller/ble/writeCharacteristic',
    startDataListener: 'controller/ble/startDataListener',
    stopDataListener: 'controller/ble/stopDataListener',
    sendB1Command: 'controller/ble/sendB1Command',
  }
}

export {
  ipcApiRoute
}

