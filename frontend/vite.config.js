import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

import path from 'path'
// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    // 项目插件
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        resolvers: [ElementPlusResolver()],
        dts: true, // 生成类型声明文件
      }),
      Components({
        resolvers: [ElementPlusResolver({
          importStyle: 'css' // 自动导入 CSS 样式
        })],
        dts: true, // 生成类型声明文件
      }),
    ],
    // 基础配置
    base: './',
    // server:{
    //   host: '0.0.0.0',
    //   port: 8080,
    //   proxy:{
    //       // 配置跨域-测试地址
    //       '/api/': {
    //           // target: "http://192.168.1.109:8083",
    //           target: "http://127.0.0.1:18080",
    //           secure: false,
    //           changeOrigin:true,
    //           rewrite: (path) => path.replace(/^\/api/, ''),
    //       },
    //   }
    // },
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            '@border-color-base': '#dce3e8',
          },
          javascriptEnabled: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      brotliSize: false,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境去除console及debug
          drop_console: false,
          drop_debugger: true,
        },
      },
    },
  }
})


