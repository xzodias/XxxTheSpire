import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // tsconfig.json の paths を Vite に自動反映（二重管理不要）
    tsconfigPaths(),
  ],
  build: {
    target: 'esnext',
  },
  define: {
    // Phaser の tree-shaking 用フラグ
    'typeof CANVAS_RENDERER': '"true"',
    'typeof WEBGL_RENDERER': '"true"',
  },
})
