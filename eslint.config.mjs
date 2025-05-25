import nextPlugin from '@next/eslint-plugin-next'
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'src/generated/**',
      '**/generated/prisma/**'
    ]
  },
  ...compat.config({
    extends: ['next/core-web-vitals']
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin
    }
  }
]
