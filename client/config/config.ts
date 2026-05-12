import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  routes,
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true
    }
  }
});
