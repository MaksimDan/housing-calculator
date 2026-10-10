import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { personalConfig } from './personal-config.js'

export default defineConfig({
  plugins: [react(), personalConfig()],
  test: {
    globals: true,
  },
})