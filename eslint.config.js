// Extends the shared @and3rn3t/eslint-config with homehub-specific rules.
import and3rn3t from '@and3rn3t/eslint-config'

export default [
  ...and3rn3t,
  { ignores: ['workers/dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
]
