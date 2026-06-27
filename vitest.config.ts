import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    server: {
      deps: {
        // pdf-parse bundles its own webpack bootstrap — vite must not transform it
        external: ['pdf-parse'],
      },
    },
  },
})
