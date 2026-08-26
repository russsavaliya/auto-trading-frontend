import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Lets every module import from the src root ('@/components/ui/Card')
      // instead of counting '../../' levels, which is what made the old flat
      // layout hard to move files around in.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
