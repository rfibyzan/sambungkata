import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      // @ts-expect-error: vite-plugin-react types might not explicitly include babel in this version
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      },
    }),
  ],
})
