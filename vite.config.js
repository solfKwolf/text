import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';

// 获取 git 提交信息
let commitHash = 'unknown';
let commitDate = 'unknown';

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  commitDate = execSync('git log -1 --format=%ci').toString().trim();
} catch (error) {
  console.warn('无法获取 git 提交信息:', error.message);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg', 'icons/*.png'],
      manifest: {
        name: '在线便签',
        short_name: '便签',
        description: '免费、便捷的在线笔记工具，支持快速创建、编辑和管理便签',
        theme_color: '#fbc02d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '32x32',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icons/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: '新建便签',
            short_name: '新建',
            description: '创建新的便签',
            url: '?action=new',
            icons: [
              {
                src: 'favicon.svg',
                sizes: '192x192'
              }
            ]
          }
        ],
        categories: ['productivity', 'utilities', 'notes'],
        lang: 'zh-CN',
        dir: 'ltr'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
  },
  build: {
    outDir: 'docs'
  },
  base: './',
  define: {
    '__COMMIT_HASH__': JSON.stringify(commitHash),
    '__COMMIT_DATE__': JSON.stringify(commitDate),
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString())
  }
});
