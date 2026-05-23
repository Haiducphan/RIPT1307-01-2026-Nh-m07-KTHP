import { join } from 'path';
import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  routes,
  npmClient: 'npm',
  mfsu: false,
  alias: {
    react: join(__dirname, '../node_modules/react'),
    'react-dom': join(__dirname, '../node_modules/react-dom')
  },
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true
    }
  }
});
