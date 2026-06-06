import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubRepository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const githubPagesBase = githubRepository ? `/${githubRepository}/` : '/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? githubPagesBase : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
