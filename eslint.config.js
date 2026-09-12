import hooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import refresh from 'eslint-plugin-react-refresh'

const browserGlobals = {
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  IntersectionObserver: 'readonly',
  window: 'readonly',
}

const nodeGlobals = {
  AbortSignal: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  process: 'readonly',
  URL: 'readonly',
}

export default [
  { ignores: ['dist/**', 'node_modules/**', 'design/**', '**/* 2.*'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: browserGlobals,
    },
    plugins: { react, 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      ...hooks.configs.flat['recommended-latest'].rules,
      ...refresh.configs.vite.rules,
    },
  },
  {
    files: ['server.mjs', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: nodeGlobals },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]
