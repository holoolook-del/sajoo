/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/sajoo/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // manifest 아이콘을 프리캐시에 자동 추가하면 globPatterns 결과와 같은 URL이 다른 revision으로
      // 중복돼 workbox가 'add-to-cache-list-conflicting-entries'로 통째로 실패한다 → 끈다(아이콘은 glob이 담당)
      includeManifestIcons: false,
      manifest: {
        name: 'SAJOO - 나의 사주',
        short_name: 'SAJOO',
        description: '한국식 사주와 오늘의 운세카드',
        lang: 'ko',
        theme_color: '#16141f',
        background_color: '#16141f',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'assets/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'assets/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json,wav}'],
        // 수면 음원(~6MB)은 프리캐시에서 제외 — 첫 방문 용량을 지키고, 재생할 때 런타임 캐시
        globIgnores: ['**/assets/audio/sleep/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/audio\/sleep\/.*\.wav$/,
            handler: 'CacheFirst',
            options: { cacheName: 'sleep-audio', expiration: { maxEntries: 8 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
