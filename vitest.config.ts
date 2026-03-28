import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      // ドメイン層・アプリケーション層はブラウザ不要なので node で高速化
      // Phaser を使う presentation 層のテストが必要になったら jsdom に変更
      environment: 'node',
      include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/domain/**', 'src/application/**'],
      },
    },
  }),
)
