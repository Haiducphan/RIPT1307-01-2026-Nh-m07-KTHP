import { defineConfig } from 'umi';
import routes from './routes';

export default defineConfig({
  routes,
  npmClient: 'npm',
  mfsu: false,
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true
    },
    '/uploads': {
      target: 'http://localhost:4000',
      changeOrigin: true
    }
  }
});
