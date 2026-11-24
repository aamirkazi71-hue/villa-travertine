import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths: the same build works at a domain root or under a GitHub Pages project path.
  base: './',
  plugins: [react(), tailwindcss()],
  // The workspace lives under a redirected AppData folder; resolving its real path breaks module loading.
  resolve: { preserveSymlinks: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ['three'], gsap: ['gsap'] } },
    },
  },
})
