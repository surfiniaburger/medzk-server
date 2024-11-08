import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "./src"), // This sets up '@' to map to the 'src' directory
    },
    server: {
      proxy: {
        '/record': {
          target: 'https://medzk-server.vercel.app/',
          changeOrigin: true,
          secure: false
        }
      }
    }
  },
});
