import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/baidu-token': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/baidu-token/, ''),
      },
      '/baidu-asr': {
        target: 'https://vop.baidu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/baidu-asr/, ''),
      },
      '/bing-search': {
        target: 'https://cn.bing.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bing-search/, ''),
      },
    },
  },
})
