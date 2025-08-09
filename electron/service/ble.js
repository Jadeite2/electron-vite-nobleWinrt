const { logger } = require('ee-core/log');
const noble = require('noble-winrt');
// 需要安装"noble-winrt": "^0.1.1"
const { BrowserWindow } = require('electron');

/**
 * BLE服务
 * @class
 */
class BLEService {
  constructor() {
    this.isScanning = false; // 扫描中
    this.connectedDevice = null; // 连接的设备
    this.devices = new Map(); // 发现的设备
    this.characteristics = new Map(); // 特征缓存
    
    // 绑定事件处理器
    this.setupEventListeners();
  }
   /**
     * 设置事件监听器
     */
  setupEventListeners() {
    noble.on('stateChange', (state) => {
      // logger.info('BLE状态变化:', state);
      if (state === 'poweredOn') {
        // logger.info('蓝牙已启用，可以开始扫描');
      } else {
        // logger.warn('蓝牙不可用:', state);
        this.stopScan();
      }
    });

    noble.on('discover', (peripheral) => {
      console.log(`发现设备: ${peripheral}`);
      // 简化设备名称处理，只使用localName或默认名称
      const deviceName = peripheral.advertisement.localName || '--';
      const deviceInfo = {
        id: peripheral.id,
        name: deviceName,
        rssi: peripheral.rssi,
        connectable: peripheral.connectable,
        state: peripheral.state,
        advertisement: {
          localName: peripheral.advertisement.localName,
          txPowerLevel: peripheral.advertisement.txPowerLevel,
          manufacturerData: peripheral.advertisement.manufacturerData ? peripheral.advertisement.manufacturerData.toString('hex') : null,
          serviceData: peripheral.advertisement.serviceData,
          serviceUuids: peripheral.advertisement.serviceUuids || [],
          solicitationServiceUuids: peripheral.advertisement.solicitationServiceUuids || []
        },
        peripheral: peripheral // 保存完整的peripheral对象以便后续连接使用
      };
      this.devices.set(peripheral.id, deviceInfo);
    });
  }
  /**
   * 停止扫描设备
   */
  async stopScan() {
    try {
      if (!this.isScanning) {
        return { success: true, message: '未在扫描中' };
      }
      noble.stopScanning();
      this.isScanning = false;
      // logger.info('停止扫描BLE设备');
      return { success: true, message: '停止扫描设备' };
    } catch (error) {
      // logger.error('停止扫描失败:', error);
      return { success: false, message: error.message };
    }
  }
   /**
   * 断开设备连接
   */
   async disconnectDevice() {
    try {
      if (!this.connectedDevice) {
        return { success: true, message: '没有连接的蓝牙设备' };
      }
      return new Promise((resolve) => {
        this.connectedDevice.disconnect((error) => {
          if (error) {
            // logger.error('断开连接失败:', error);
          } else {
            // logger.info('设备断开连接成功');
          }  
          this.connectedDevice = null;
          this.characteristics.clear();
          resolve({
            success: true,
            message: '蓝牙设备已断开连接'
          });
        });
      });
    } catch (error) {
      // logger.error('断开设备异常:', error);
      return { success: false, message: error.message };
    }
  }
  /**
   * 获取蓝牙状态
   */
  async getBluetoothState() {
    return {
      state: noble.state,
      isScanning: this.isScanning,
      connectedDevice: this.connectedDevice ? {
        id: this.connectedDevice.id,
        name: this.connectedDevice.advertisement.localName || '--',
        state: this.connectedDevice.state,
        connectable: this.connectedDevice.connectable,
        rssi: this.connectedDevice.rssi,
        advertisement: {
          localName: this.connectedDevice.advertisement.localName,
          txPowerLevel: this.connectedDevice.advertisement.txPowerLevel,
          manufacturerData: this.connectedDevice.advertisement.manufacturerData ? this.connectedDevice.advertisement.manufacturerData.toString('hex') : null,
          serviceData: this.connectedDevice.advertisement.serviceData,
          serviceUuids: this.connectedDevice.advertisement.serviceUuids || [],
          solicitationServiceUuids: this.connectedDevice.advertisement.solicitationServiceUuids || []
        }
      } : null
    };
  }
  /**
   * 获取扫描到的设备列表
   */
  async getDevices() {
    const deviceList = Array.from(this.devices.values()).map(device => ({
      id: device.id,
      name: device.name,
      rssi: device.rssi,
      connectable: device.connectable,
      state: device.state,
      advertisement: {
        localName: device.advertisement.localName,
        txPowerLevel: device.advertisement.txPowerLevel,
        manufacturerData: device.advertisement.manufacturerData,
        serviceData: device.advertisement.serviceData,
        serviceUuids: device.advertisement.serviceUuids,
        solicitationServiceUuids: device.advertisement.solicitationServiceUuids
      }
    }));
    return {
      success: true,
      devices: deviceList,
      count: deviceList.length
    };
  }
   /**
   * 开始扫描设备
   */
  async startScan() {
    try {
      if (noble.state !== 'poweredOn') {
        return { success: false, message: '蓝牙未启用'};
      }
      if (this.isScanning) {
        return { success: true, message: '已经在扫描中...' };
      }
      this.devices.clear();
      this.isScanning = true;
      // 扫描所有设备
      await noble.startScanning([], true);
      // logger.info(noble, 'noblenoblenoblenoble')
      // await noble.startScanningAsync([], false);
      return { success: true, message: '开始扫描设备' };
    } catch (error) {
      this.isScanning = false;
      return { success: false, message: error.message };
    }
  }
/**
   * 连接设备
   */
  async connectDevice(deviceId, serviceUuid, writeUuid, notifyUuid) {
    logger.info('设备连接开始:', deviceId);
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, message: '设备未找到' };
    }
    const peripheral = device.peripheral;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('连接超时')), 10000)
    );
    const connectPromise = new Promise((resolve, reject) => {
      peripheral.connect((error) => {
        if (error) {
          logger.error('连接设备失败:', error);
          reject(error);
          return;
        }
        this.connectedDevice = peripheral;
        peripheral.discoverServices([serviceUuid], (error, services) => {
          if (error) {
            reject(error);
            return;
          }
          // logger.info(services, 'serviceserviceserviceservices', services.size)
          const service = services.find(item => item.uuid === serviceUuid);
          if (!service) {
            reject(new Error('未找到服务: ' + services));
            return;
          }
          // logger.info(service, '222222222222222222222', service.size) 
          // 查找 writeUuid 特征
          service.discoverCharacteristics([].filter(Boolean), (error, characteristics) => {
            logger.info(characteristics, '11111111111') 
            if (error) {
              reject(error);
              return;
            }
            // 缓存 writeUuid 特征
            const writeChar = characteristics.find(item => item.uuid === writeUuid);
            if (writeChar) {
              this.characteristics.set(writeUuid, writeChar);
              // logger.info('设备连接成功并缓存writeUuid特征:', writeUuid);
            }
            // 缓存 notifyUuid 特征（如果有）
            if (notifyUuid) {
              const notifyChar = characteristics.find(item => item.uuid === notifyUuid);
              if (notifyChar) {
                this.characteristics.set(notifyUuid, notifyChar);
                // logger.info('设备连接成功并缓存notifyUuid特征:', notifyUuid);
              }
            }
            // logger.info(this.characteristics, 'this.characteristicsthis.characteristicsthis.characteristics', this.characteristics.size)
            resolve({
              success: true,
              message: '设备连接成功',
              device: { id: device.id, name: device.name },
              services: services.length
            });
          });
        });
      });
    });
    try {
      return await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      logger.error('连接设备异常:', error);
      return { success: false, message: error.message };
    }
  }
   /**
   * 启动数据监听
   */
  async startDataListener(serviceUuid, notifyUuid) {
    if (!this.connectedDevice) {
      return { success: false, message: '没有连接的设备' };
    }
    try {
      // 直接从缓存获取 notify 特征
      const characteristic = this.characteristics.get(notifyUuid);
      if (!characteristic) {
        return { success: false, message: '未缓存notify特征，请先连接设备' };
      }
      // 设置监听
      return await this.setupCharacteristicDataListener(characteristic, serviceUuid, notifyUuid);
    } catch (error) {
      console.error('启动数据监听异常', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 设置特征数据监听
   */
  async setupCharacteristicDataListener(characteristic, serviceUuid, notifyUuid) {
    try {
      // 移除旧监听器，避免重复
      characteristic.removeAllListeners && characteristic.removeAllListeners('data');
      // 设置数据监听
      characteristic.on('data', (data) => {
        const hexData = data.toString('hex');
        logger.info('data====>>>>>>>', data);
        // 直接向渲染进程发送数据
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('ble-data-received', {
            data: data,
            hexData: hexData,
            serviceUuid: serviceUuid,
            characteristicUuid: notifyUuid
          });
        }
      });
      await new Promise((resolve, reject) => {
        characteristic.subscribe((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      return {
        success: true,
        message: `notifyUuid数据监听已启动 (特征: ${notifyUuid})`
      };
    } catch (error) {
      console.error('设置特征数据监听异常', error);
      return { success: false, message: error.message };
    }
  }
  /**
   * 停止数据监听
   */
  async stopDataListener(serviceUuid, characteristicUuid) {
    try {
      if (!this.connectedDevice) {
        return { success: true, message: '没有连接的设备' };
      }
      return new Promise((resolve, reject) => {
        this.connectedDevice.discoverServices([serviceUuid], (error, services) => {
          if (error || !services.length) {
            resolve({ success: true, message: '服务未找到，视为已停止' });
            return;
          }

          const service = services.find(item => item.uuid === serviceUuid);
          
          service.discoverCharacteristics([characteristicUuid], (error, characteristics) => {
            if (error || !characteristics.length) {
              resolve({ success: true, message: '特征未找到，视为已停止' });
              return;
            }
            logger.info(characteristics, '1111111111111111111111111111111')
            const characteristic = characteristics.find(item => item.uuid === characteristicUuid);
            if (!characteristic) {
              logger.info('未找到特征，无法取消订阅');
              resolve({
                success: true,
                message: '特征未找到，视为已停止'
              });
              return;
            }
            // 取消通知订阅
            characteristic.unsubscribe((error) => {
              if (error) {
                logger.info('停止蓝牙数据监听失败:', error);
              }
              // 移除所有数据监听器
              characteristic.removeAllListeners('data');
              logger.info('蓝牙数据监听已停止');
              resolve({
                success: true,
                message: '数据监听已停止'
              });
            });
          });
        });
      });
    } catch (error) {
      console.error('停止数据监听异常:', error);
      return { success: false, message: error.message };
    }
  }
  buildProtocolPacket(cmd, mudata) {
    const mudataLen = mudata == undefined ? 0 : mudata.length;
    // 根据自己的业务需求可能会有一些帧头帧尾+校验和的验证处理，需要自己根据业务实现
    let command = new Array(mudataLen + 7)
    command[0] = 0x95 //帧头
    command[1] = 0xAB //帧头
    command[2] = (1 + mudataLen + 2 + 1)//mudataLen是参数长度
    command[3] = cmd //命令码
    return command
  }

  /**
   * 发送0xB0命令
   * @param {Array<number>|string} cmd - 命令或数据
   * @param {string} writeUuid - 特征UUID
   */
  async sendB1Command(cmd, serviceUuid, writeUuid) {
    try {
      // 开始发送0xB0命令
      if (!this.connectedDevice) {
        const error = '没有连接的设备';
        console.error('send error:', error);
        return { success: false, message: error };
      }
      const characteristic = this.characteristics.get(writeUuid);
      // logger.info(this.characteristics, 'characteristiccharacteristiccharacteristiccharacteristic')
      if (!characteristic) {
        return { success: false, message: '未缓存特征，请先连接设备' };
      }
      // 构建0xB0命令数据包
      let packet = null;
      let dataBuffer = null;
      let hexData = null;
      // 手动按钮发送
      if (typeof(cmd) == 'number') {
        // 处理成Buffer传给蓝牙，可以自己修改
        packet = this.buildProtocolPacket(cmd);
        dataBuffer = Buffer.from(packet)
        hexData = dataBuffer.toString('hex');
      }
      await new Promise((resolve, reject) => {
        characteristic.write(dataBuffer, false, (error) => {
          if (error) {
            reject(new Error(`写入数据失败: ${error.message}`));
          } else {
            resolve();
          }
        });
      });
      return {
        success: true,
        message: `${cmd}发送成功`,
        dataBuffer: dataBuffer,
        sentData: hexData.toUpperCase(),
        usedCharacteristic: characteristic.uuid
      };
    } catch (error) {
      console.error('发送0xB0命令异常:', error);
      return { success: false, message: `发送命令异常: ${error.message}` };
    }
  }
}

BLEService.toString = () => '[class BLEService]';

module.exports = {
  BLEService,
  bleService: new BLEService()
}; 