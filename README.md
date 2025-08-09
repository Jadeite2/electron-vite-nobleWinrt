# 说明

## 一、概述

集成 `noble-winrt` 的蓝牙低功耗功能
[详细操作文档及代码实现，看这个](https://blog.csdn.net/Jadeite2/article/details/150112693?sharetype=blogdetail&sharerId=150112693&sharerefer=PC&sharesource=Jadeite2&spm=1011.2480.3001.8118)


# 本项目为使用electorn-egg V4版本开发，集成BLE(蓝牙低功耗)蓝牙的demo
# 需要先在外层npm install，然后cd到frontend目录下进行npm install，最后回到外层根目录 npm run dev运行！

## ✨ main分支使用"noble-winrt": "^0.1.1"开发(较老旧且无人维护,npm及github无api)，仅支持win10/win11系统，无需安装其他编译插件
## node v20.12.1




## 二、项目结构，electorn-egg V4版本官方结构
project
├── package.json npm包配置
├── bulid 打包用的资源和脚本
    ├── icons 软件图标（打包用到）
    ├── extraResources 额外资源目录
├── cmd 脚本/打包 命令配置
    ├── bin.js 开发环境配置    
    ├── builder-xxx.json 打包配置
├── electron 主进程服务
    ├── main.js 入口文件 
    ├── config 配置文件
        ├── config.default.js 默认配置，都会加载
        ├── config.local.js dev环境加载
        ├── config.prod.js 生产环境加载
    ├── controller 控制器
    ├── service 业务层
    ├── preload 预加载
        ├── index.js 入口文件，在程序启动时加载，如托盘、自动升级等功能要提前加载代码
        ├── bridge.js 桥接文件
        ├── lifecycle.js 生命周期函数
    ├── jobs 任务
├── frontend 前端目录（demo是用vue编写的）  
├── go go目录(可选)
├── out 打包后生成的可执行文件
    ├── latest.yml 自动升级文件
    ├── xxx.exe window应用安装包
    ├── xxx.exe.blockmap window应用增量升级包
    ├── xxx.dmg mac应用安装包
    ├── xxx.deb linux应用安装包后缀有多种    
├── logs 日志 
├── public 资源目录
    ├── dist 前端资源会移动到这里，生产环境加载
    ├── electron 主进程代码，生产环境加载
    ├── html 一些模板
    ├── images 一些图片
├── data 内置数据库文件
    ├── sqlite-demo.db 示例sqlite数据库






# service中ble.js对noble-winrt方法的总结及参考

## 1. 基本引用

```js
const noble = require('noble-winrt');
```

---

## 2. 事件监听

### noble.on('stateChange', callback)
- 监听蓝牙适配器状态变化。
- 常见状态：`poweredOn`, `poweredOff`, `resetting`, `unauthorized`, `unsupported`, `unknown`
- 示例：
  ```js
  noble.on('stateChange', (state) => {
    if (state === 'poweredOn') {
      // 可以开始扫描
    } else {
      // 停止扫描
    }
  });
  ```

### noble.on('discover', callback)
- 发现蓝牙设备时触发。
- 回调参数为 `peripheral` 设备对象。
- 示例：
  ```js
  noble.on('discover', (peripheral) => {
    // peripheral.advertisement.localName
    // peripheral.id
    // peripheral.rssi
  });
  ```

---

## 3. 扫描相关

### noble.startScanning([serviceUUIDs], allowDuplicates, [callback])
- 开始扫描设备。
- `serviceUUIDs`：要扫描的服务 UUID 数组，空数组表示扫描所有设备。
- `allowDuplicates`：是否允许重复发现同一设备。
- 示例：
  ```js
  noble.startScanning([], true);
  ```

### noble.stopScanning([callback])
- 停止扫描设备。
- 示例：
  ```js
  noble.stopScanning();
  ```

---

## 4. Peripheral（设备对象）API

### peripheral.id
- 设备唯一标识符。

### peripheral.advertisement
- 设备广播信息对象，包含：
  - `localName`
  - `txPowerLevel`
  - `manufacturerData`
  - `serviceData`
  - `serviceUuids`
  - `solicitationServiceUuids`

### peripheral.connect(callback)
- 连接到设备。
- 示例：
  ```js
  peripheral.connect((error) => { ... });
  ```
### peripheral.discoverServices([serviceUUIDs], callback)
- 发现设备的服务。
- `serviceUUIDs`：要发现的服务 UUID 数组。
- 回调参数：`(error, services)`
- 示例：
  ```js
  peripheral.discoverServices([serviceUuid], (error, services) => { ... });
  ```

### peripheral.disconnect(callback)
- 断开设备连接。
- 示例：
  ```js
  peripheral.disconnect((error) => { ... });
  ```

---

## 5. Service（服务对象）API

### service.uuid
- 服务的 UUID。

### service.discoverCharacteristics([characteristicUUIDs], callback)
- 发现服务下的特征。
- `characteristicUUIDs`：要发现的特征 UUID 数组。
- 回调参数：`(error, characteristics)`
- 示例：
  ```js
  service.discoverCharacteristics([writeUuid, notifyUuid], (error, characteristics) => { ... });
  ```

---

## 6. Characteristic（特征对象）API

### characteristic.uuid
- 特征的 UUID。

### characteristic.write(data, withoutResponse, callback)
- 向特征写入数据。
- `data`：Buffer 类型数据。
- `withoutResponse`：布尔值，是否不需要响应。
- 示例：
  ```js
  characteristic.write(Buffer.from([0x01, 0x02]), false, (error) => { ... });
  ```

### characteristic.subscribe(callback)
- 订阅特征的通知（notify）。
- 示例：
  ```js
  characteristic.subscribe((error) => { ... });
  ```

### characteristic.unsubscribe(callback)
- 取消订阅通知。
- 示例：
  ```js
  characteristic.unsubscribe((error) => { ... });
  ```

### characteristic.on('data', callback)
- 监听特征数据变化（notify）。
- 示例：
  ```js
  characteristic.on('data', (data) => {
    // data为Buffer
  });
  ```

### characteristic.removeAllListeners('data')
- 移除所有数据监听器。

---

## 7. noble.state
- 当前蓝牙适配器状态（字符串）。

---

## 参考流程（结合本项目代码）

1. 监听 `stateChange`，`poweredOn` 时允许扫描。
2. 调用 `noble.startScanning()` 开始扫描。
3. 监听 `discover` 事件，获取 `peripheral`。
4. 通过 `peripheral.connect()` 连接设备。
5. 通过 `peripheral.discoverServices()` 获取服务。
6. 通过 `service.discoverCharacteristics()` 获取特征。
7. 通过 `characteristic.write()` 写数据，`characteristic.subscribe()` 订阅通知，`characteristic.on('data')` 监听数据。

---

## 其他说明

- `noble-winrt` 仅支持 Windows 10/11，且需要蓝牙适配器支持 BLE。
- 设备发现、连接、服务/特征发现、数据收发流程与经典 noble 基本一致。
- 详细参数和回调结构可参考 [noble 文档](https://github.com/noble/noble)，但是不完全一样，不要直接套用里面的api，用我项目里的api，都是经过我自己踩坑看源码测试出来的。





