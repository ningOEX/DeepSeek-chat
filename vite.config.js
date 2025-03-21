import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 将 @ 配置为 src 目录的别名
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    cors: true,
    open: false,
    proxy: {
      "/api": {
        // target: "http://192.168.10.111:11434",
        target: "http://127.0.0.1:11434",
        changeOrigin: false,
        // configure: (proxy, options) => {
        //   // 添加代理事件监听器，用于调试
        //   proxy.on('proxyReq', (proxyReq, req, res) => {
        //     console.log(proxyReq)
        //     proxyReq.removeHeader('referer') // 移除请求头
        //     proxyReq.removeHeader('origin') // 移除请求头
        //   })
        // },
      }
    }
  },
})
