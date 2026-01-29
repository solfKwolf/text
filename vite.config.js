import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
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
  plugins: [vue()],
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
