import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '艾宾浩斯记忆',
        short_name: '记忆',
        description: '基于艾宾浩斯遗忘曲线的极简记忆应用',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg', // placeholder
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg', // placeholder
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
