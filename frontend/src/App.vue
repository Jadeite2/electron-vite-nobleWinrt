<template>
  <div id="app">
    <!-- 自定义标题栏 -->
    <!-- <div class="custom-title-bar">
      <span class="title-text">{{ pageTitle }}</span>
      <div class="window-controls">
        <button class="control-btn minimize-btn" @click="minimizeWindow" title="最小化">
          <span class="control-icon">−</span>
        </button>
        <button 
          v-if="route.name !== 'LoginIndex'" 
          class="control-btn maximize-btn" 
          @click="toggleMaximize" 
          title="全屏/还原"
        >
          <span class="control-icon">{{ isMaximized ? '❐' : '□' }}</span>
        </button>
        <button class="control-btn close-btn" @click="closeWindow" title="关闭">
          <span class="control-icon">×</span>
        </button>
      </div>
    </div> -->
    <router-view/>
  </div>
</template>
<script setup>
import { onMounted, computed, ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ipc } from '@/utils/ipcRenderer';
import { ipcApiRoute } from '@/api';

const route = useRoute();

// 获取页面标题
const pageTitle = computed(() => {
  return route.meta?.title || '应用程序';
});

// 窗口最大化状态
const isMaximized = ref(false);

// 窗口控制方法
const minimizeWindow = () => {
  if (ipc) {
    ipc.invoke(ipcApiRoute.effect.windowMinimize);
  }
};

const toggleMaximize = () => {
  if (ipc) {
    ipc.invoke(ipcApiRoute.effect.windowToggleMaximize);
  }
};

const closeWindow = () => {
  if (ipc) {
    ipc.invoke(ipcApiRoute.effect.windowClose);
  }
};

// 监听窗口状态变化
const handleMaximizeChange = (event, maximized) => {
  isMaximized.value = maximized;
};

onMounted(() => {
  const loadingElement = document.getElementById('loadingPage');
  if (loadingElement) {
    loadingElement.remove();
  }
  
  // 监听窗口最大化/还原事件
  if (ipc) {
    ipc.on('window-maximized', handleMaximizeChange);
    ipc.on('window-unmaximized', handleMaximizeChange);
    // 获取初始窗口状态
    ipc.invoke(ipcApiRoute.effect.windowIsMaximized).then(maximized => {
      isMaximized.value = maximized;
    });
  }
});

onUnmounted(async () => {
  // 清理事件监听
  if (ipc) {
    ipc.removeListener('window-maximized', handleMaximizeChange);
    ipc.removeListener('window-unmaximized', handleMaximizeChange);
  }
});
</script>
<style lang="less">
.custom-title-bar {
  height: 30px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  user-select: none; /* 禁止选择文本 */
  background-color: #e8f4fd !important;
  // -webkit-app-region: drag !important;
  position: relative;
  z-index: 1000;
  
  .title-text {
    font-size: 13px;
    color: #333;
    font-weight: 500;
    flex: 1;
    text-align: left;
    padding-left: 20px;
    // -webkit-app-region: drag !important;
    // app-region: drag !important;
  }
  
  .window-controls {
    display: flex;
    align-items: center;
    // -webkit-app-region: no-drag !important;
    // app-region: no-drag !important;
    .control-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
      // -webkit-app-region: no-drag !important;
      // app-region: no-drag !important;
      .control-icon {
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
      }
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      &.minimize-btn {
        .control-icon {
          font-size: 14px;
          margin-top: -2px;
        }
        
        &:hover {
          background-color: rgba(0, 123, 255, 0.1);
        }
      }
      
      &.maximize-btn {
        .control-icon {
          font-size: 10px;
        }
        
        &:hover {
          background-color: rgba(0, 123, 255, 0.1);
        }
      }
      
      &.close-btn {
        .control-icon {
          font-size: 14px;
        }
        
        &:hover {
          background-color: #e74c3c;
          color: white;
        }
      }
    }
  }
}

/* 确保应用占满整个窗口 */
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体滚动 */
}

/* router-view 占用剩余空间，高度为 100vh - title-bar高度 */
.router-view {
  flex: 1;
  // height: calc(100vh - 30px); /* 减去title-bar的高度 */
  height: 100vh;
  overflow-y: auto; /* 只允许垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动 */
}
</style>
