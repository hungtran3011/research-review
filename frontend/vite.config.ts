import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  ssr: {
    noExternal: ['@fluentui/react-components', '@fluentui/react-icons'],
  },
})
