import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages ilovani "/Barber_Giyos_booking/" ostidan beradi, Render va
  // Vercel esa ildizdan — shuning uchun yig'ish paytida belgilanadi.
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    // Brauzerda test qilganda API so'rovlari backendga yo'naltiriladi
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
