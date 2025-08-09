<template>
  <div class="indexBox">
    <div class="main-content">
      <div class="content">
        <div class="main-content-box">
          <div class="box-right">
            <div class="box-right-content">
              <div class="ble-section">
                <h3>蓝牙设备管理</h3>
                <!-- 蓝牙状态 -->
                <div class="status-section">
                  <div class="status-item">
                    <span>蓝牙状态:</span>
                    <span :class="['status-value', bluetoothState.state === 'poweredOn' ? 'status-on' : 'status-off']">
                      {{ bluetoothStatusText }}
                    </span>
                  </div>
                  <div class="status-item" v-if="bluetoothState.connectedDevice">
                    <span>连接设备:</span>
                    <span class="status-value status-connected">{{ bluetoothState.connectedDevice.name }}</span>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="button-section">
                  <button @click="startScan" class="btn-primary">
                    {{ bluetoothState.isScanning ? '扫描中...' : '扫描设备' }}
                  </button>
                  <button @click="stopScan" class="btn-secondary">
                    停止扫描
                  </button>
                  <button @click="refreshBluetoothState" class="btn-refresh">
                    刷新状态
                  </button>
                  <button @click="sendB1Command(0xB0)" class="btn-send-command"
                    :disabled="!bluetoothState.connectedDevice">
                    发送0xB0
                  </button>
                  <button @click="startDataListener" class="btn-send-command"
                    :disabled="!bluetoothState.connectedDevice">
                    启动蓝牙数据监听
                  </button>
                </div>

                <!-- 设备列表 -->
                <div class="device-list">
                  <h4>发现的设备 ({{ devices.length }})</h4>
                  <div class="device-items">
                    <div v-for="device in devices" :key="device.id" class="device-item"
                      @click="connectDevice(device.id, device.name)">
                      <div class="device-info">
                        <div class="device-name">{{ device.name }}</div>
                        <div class="device-id">{{ device.id }}</div>
                      </div>
                      <div class="device-rssi">{{ device.rssi }}dBm</div>
                    </div>
                  </div>
                </div>

                <!-- 连接控制 -->
                <div class="connection-section" v-if="bluetoothState.connectedDevice">
                  <button @click="disconnectDevice" class="btn-disconnect">
                    断开连接
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineOptions({
  name: 'FvcFunctionPage'
})

import { ref, computed, onMounted, onUnmounted,  } from 'vue';
import { ipcApiRoute } from '@/api';
import { ipc } from '@/utils/ipcRenderer';
import { useRouter } from 'vue-router';


//手机蓝牙助手测试 （需要替换成自己的手机蓝牙的uuid，不然订阅和发送无法成功）
const SERVICE_UUID = '0000fff0-0000-10001-8000-00805f9b34fb';
const NOTIFY_UUID = '0000fff1-0000-10001-8000-00805f9b34fb';
const WRITE_UUID = '0000fff2-0000-10001-8000-00805f9b34fb';

const router = useRouter();


// 蓝牙相关状态
const bluetoothState = ref({
  state: 'unknown',
  isScanning: false,
  connectedDevice: null
});

// 设备列表
const devices = ref([]);
let scanTimer = null;


const measurementData = ref(null);
const connectDeviceId = ref('');
const connectDeviceName = ref('');

// 计算属性
const bluetoothStatusText = computed(() => {
  switch (bluetoothState.value.state) {
    case 'poweredOn': return '已启用';
    case 'poweredOff': return '已关闭';
    case 'unauthorized': return '未授权';
    case 'unsupported': return '不支持';
    case 'unknown': return '未知';
    default: return bluetoothState.value.state;
  }
});
const fvcRatio = computed(() => {
  if (!measurementData.value || !measurementData.value.fev1 || !measurementData.value.fvc) {
    return '--';
  }
  const ratio = (measurementData.value.fev1 / measurementData.value.fvc * 100).toFixed(1);
  return `${ratio}%`;
});

// 定时器
let statusTimer = null;

// 生命周期
onMounted(() => {
  refreshBluetoothState();
  // 定期更新蓝牙状态
  statusTimer = setInterval(refreshBluetoothState, 5000);
  // 设置BLE数据接收监听
  ipc.on('ble-data-received', (event, data) => {
    console.log('接收到BLE发送来的数据:', data);
  });

});

onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer);
  }
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  // 页面卸载时停止数据监听
  stopDataListener();
  // 移除BLE数据事件监听
  ipc.removeAllListeners('ble-data-received');
});
// 蓝牙操作方法
async function refreshBluetoothState() {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.getBluetoothState);
    bluetoothState.value = result;
    // console.log('获取蓝牙状态111', result)
  } catch (error) {
    console.error('获取蓝牙状态失败:', error);
  }
}

async function startScan() {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.startScan);
    // console.log('startScanstartScanstartScan')
    if (result.success) {
      // 开始扫描后，每2秒刷新设备列表
      if (scanTimer) clearInterval(scanTimer);
      await getDevices();
      scanTimer = setInterval(getDevices, 2000);
    } else {
      console.log('开始扫描失败: ' + result.message);
    }
  } catch (error) {
    console.error('开始扫描失败:', error);
  }
}
async function stopScan() {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.stopScan);
    if (result.success) {
      console.log(result.message);
      if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
      }
    } else {
      console.log('停止扫描失败: ' + result.message);
    }
  } catch (error) {
    console.error('停止扫描失败:', error);
  }
}

async function getDevices() {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.getDevices);
    // console.log(result, '设备列表')
    if (result.success) {
      const found = (result.devices || []).filter(item => item.name && item.name.indexOf('AK62') > -1);
      // 只添加新设备
      found.forEach(device => {
        if (!devices.value.some(d => d.id === device.id)) {
          devices.value.push(device);
        }
      });
    }
  } catch (error) {
    console.error('获取设备列表失败:', error);
  }
}
// 连接设备
async function connectDevice(deviceId, deviceName) {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.connectDevice, { deviceId, serviceUuid: SERVICE_UUID, writeUuid: WRITE_UUID, notifyUuid: NOTIFY_UUID });
    console.log(result, 'resultresultresult')
    if (result.success) {
      console.log('设备连接成功connectDevice: ' + result);
      connectDeviceId.value = deviceId;
      connectDeviceName.value = deviceName;
      // 连接成功后停止扫描
      await stopScan();
      await refreshBluetoothState();
      // 启动数据监听
      await startDataListener();
    } else {
      console.log('蓝牙设备连接失败1: ' + result.message);
    }
  } catch (error) {
    console.error('蓝牙连接设备失败2:', error);
  }
}
// 断开蓝牙连接
async function disconnectDevice() {
  try {
    // 先停止数据监听
    await stopDataListener();
    const result = await ipc.invoke(ipcApiRoute.ble.disconnectDevice);
    console.log(result, 'result111122222')
    if (result.success) {
      await refreshBluetoothState();
    } else {
      alert('断开连接失败: ' + result.message);
    }
  } catch (error) {
    console.error('断开连接失败:', error);
    alert('断开连接失败: ' + error.message);
  }
}

// 数据监听相关函数
async function startDataListener(st) {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.startDataListener, {
      serviceUuid: SERVICE_UUID,
      notifyUuid: NOTIFY_UUID,
      st
    });
    // console.log(result, '数据监听')
    if (result.success) {
      console.log('数据监听已启动:', result.message);
    } else {
      console.error('启动数据监听失败:', result.message);
    }
    return result;
  } catch (error) {
    console.error('启动数据监听异常:', st, error);
    return { success: false, message: error?.message || '未知错误' };
  }
}


// 停止数据监听
async function stopDataListener() {
  try {
    const result = await ipc.invoke(ipcApiRoute.ble.stopDataListener, {
      serviceUuid: SERVICE_UUID,
      characteristicUuid: NOTIFY_UUID
    });

    if (result.success) {
      console.log('数据监听已停止1:', result.message);
    } else {
      console.error('停止数据监听失败:', result.message);
    }
  } catch (error) {
    console.error('停止数据监听异常:', error);
  }
}

// 发送0xB1命令
async function sendB1Command(cmd) {
  try {
    // console.log('=== 开始发送0xB1命令 === 当前蓝牙状态:', bluetoothState, cmd);
    console.log(bluetoothState.value, 'bluetoothState.valuebluetoothState.valuebluetoothState.value')
    if (!bluetoothState.value.connectedDevice) {
      alert('请先连接蓝牙设备');
      return;
    }
    // console.log(typeof(cmd), 'cmdcmdcmdcmdcmdcmdcmdcmdcmdcmdcm')
    const result = await ipc.invoke(ipcApiRoute.ble.sendB1Command, {
      deviceId: connectDeviceId.value,
      serviceUuid: SERVICE_UUID,
      writeUuid: WRITE_UUID,
      cmd
    });
    console.log(result, '发送0xB1命令111')
    if (result.success) {
      console.log('蓝牙命令发送成功:', result);
    } else {
      console.error('蓝牙命令发送失败:', result);
    }
  } catch (error) {
    console.error('发送0xB1命令异常:', error);
  }
}

</script>

<style lang="less" scoped>
.indexBox {
  display: flex;
  height: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 8px 0 0 8px;
}

.main-content-box {
  display: flex;
  height: 100%;
  gap: 8px;
}

.box-left {
  width: 510px;
  height: 100%;
  flex-shrink: 0;
  background-color: rgba(255, 255, 255, 1);
  padding: 16px;
  overflow-y: auto;
}

.box-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.box-right-title {
  height: 60px;
  flex-shrink: 0;
  background: #fff;
  padding: 20px 16px;
  line-height: 20px;
  color: rgba(0, 0, 0, 1);
  font-size: 16px;
  text-align: left;

  .box-right-title-value {
    line-height: 20px;
    color: rgba(0, 0, 0, 1);
    font-size: 16px;
    font-weight: bold;
  }
}

.box-right-content {
  flex: 1;
  padding: 23px 16px;
  background: #fff;
}

.chartsItems {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  gap: 20px;

  .dif {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* BLE相关样式 */
.ble-section {
  h3 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 18px;
  }
}

.status-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;

  .status-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .status-value {
    font-weight: bold;

    &.status-on {
      color: #52c41a;
    }

    &.status-off {
      color: #f5222d;
    }

    &.status-connected {
      color: #1890ff;
    }
  }
}

.button-section {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.btn-primary {
      background: #1890ff;
      color: white;

      &:hover:not(:disabled) {
        background: #40a9ff;
      }
    }

    &.btn-secondary {
      background: #f0f0f0;
      color: #333;

      &:hover:not(:disabled) {
        background: #e0e0e0;
      }
    }

    &.btn-refresh {
      background: #52c41a;
      color: white;

      &:hover:not(:disabled) {
        background: #73d13d;
      }
    }

    &.btn-send-command {
      background: #722ed1;
      color: white;

      &:hover:not(:disabled) {
        background: #9254de;
      }

      &:disabled {
        background: #d9d9d9;
        color: #00000040;
      }
    }
  }
}

.device-list {
  h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 16px;
  }

  .device-items {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  .device-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f5f5f5;
    }

    .device-info {
      flex: 1;

      .device-name {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .device-id {
        font-size: 12px;
        color: #666;
      }
    }

    .device-rssi {
      font-size: 12px;
      color: #999;
    }
  }
}

.connection-section {
  margin-top: 16px;

  .btn-disconnect {
    padding: 8px 16px;
    background: #f5222d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #ff4d4f;
    }
  }
}
</style>