import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  ssr: {
    external: ['bcryptjs', '@prisma/client'],
    noExternal: [],
    resolve: {
      externalConditions: ['node'],
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        return id === '@prisma/client' || id.startsWith('@prisma/client/')
      },
    },
  },
})
