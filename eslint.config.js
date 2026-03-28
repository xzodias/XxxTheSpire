import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'coverage', '*.config.*'] },
  {
    extends: [...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      // React 17+ では import React が不要
      'react/react-in-jsx-scope': 'off',
      // ドメイン層で any を使わないよう警告
      '@typescript-eslint/no-explicit-any': 'error',
      // ok/err 等のエクスポート名がローカル変数に意図せず上書きされるのを防ぐ
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  prettierConfig,
)
