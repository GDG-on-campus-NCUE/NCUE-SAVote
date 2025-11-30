import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { UserConfig as VitestUserConfig } from 'vitest/config'

type ExtendedUserConfig = UserConfig & {
  test?: VitestUserConfig['test']
}

const config: ExtendedUserConfig = {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    exclude: ['tests/e2e/**'],
  },
}

// https://vite.dev/config/
export default defineConfig(config)
