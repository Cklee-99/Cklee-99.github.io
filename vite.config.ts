import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages user-site deployment: this repository is served from the
  // domain root (https://cklee-99.github.io/). Keep the production base '/'.
  base: '/',
  plugins: [react()],
})
