'use strict';

const { logger } = require('ee-core/log');
const { bleService } = require('../service/ble');
// const {bleService} = require('../service/abandonwareNble');

/**
 * BLE控制器
 * @class
 */
class BLEController {

  /**
   * 获取蓝牙状态
   */
  async getBluetoothState() {
    // logger.info('获取蓝牙状态11111111');
    return await bleService.getBluetoothState();
  }
  /**
   * 开始扫描设备
   */
  async startScan() {
    // logger.info('开始扫描BLE设备');
    return await bleService.startScan();
  }
  /**
   * 停止扫描设备
   */
  async stopScan() {
    // logger.info('停止扫描BLE设备');
    return await bleService.stopScan();
  }
  /**
   * 获取扫描到的设备列表
   */
  async getDevices() {
    // logger.info('获取设备列表');
    return await bleService.getDevices();
  }
  /**
   * 连接设备
   * @param {Object} args - 参数对象
   * @param {string} args.deviceId - 设备ID
   */
  async connectDevice(args) {
    const { deviceId, serviceUuid, writeUuid, notifyUuid } = args;
    logger.info('ljsb:', deviceId);
    
    if (!deviceId) {
      return { success: false, message: '设备ID不能为空' };
    }
    return await bleService.connectDevice(deviceId, serviceUuid, writeUuid, notifyUuid);
  }

  /**
   * 断开设备连接
   */
  async disconnectDevice() {
    // logger.info('断开设备连接');
    return await bleService.disconnectDevice();
  }

  /**
   * 启动数据监听
   * @param {Object} args - 参数对象
   * @param {string} args.serviceUuid - 服务UUID
   * @param {string} [args.notifyUuid] - 特征UUID
   */
  async startDataListener(args) {
    const { serviceUuid, notifyUuid} = args;
    // 启动数据监听
    logger.info('启动数据监听:', { serviceUuid, notifyUuid });
    
    if (!serviceUuid) {
      return { success: false, message: '服务UUID不能为空' };
    }
    
    return await bleService.startDataListener( serviceUuid, notifyUuid);
  }
   /**
   * 停止数据监听
   * @param {Object} args - 参数对象
   * @param {string} args.serviceUuid - 服务UUID
   * @param {string} [args.characteristicUuid] - 特征UUID（可选，不提供则停止所有通知）
   */
  async stopDataListener(args) {
    const { serviceUuid, characteristicUuid } = args;
    // logger.info('停止数据监听:', { serviceUuid, characteristicUuid });
    logger.info('停止蓝牙数据监听');
    
    if (!serviceUuid) {
      return { success: false, message: '服务UUID不能为空' };
    }
    
    return await bleService.stopDataListener(serviceUuid, characteristicUuid);
  }
   /**
   * 发送0xB1命令
   * @param {Object} args - 参数对象
   * @param {Array<number>} [args.params] - 参数数组
   * @param {string} [args.serviceUuid] - 服务UUID
   * @param {string} [args.writeUuid] - 特征UUID
   */
  async sendB1Command(args = {}) {
    const { serviceUuid, writeUuid, cmd } = args;
    // 发送0xB1命令
    // logger.info('fasong--0xB1--mingling', { serviceUuid, writeUuid, cmd });
    return await bleService.sendB1Command(cmd, serviceUuid, writeUuid);
  }
}

BLEController.toString = () => '[class BLEController]';

module.exports = BLEController; 