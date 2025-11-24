import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Configuration multi-page: ajout de dashboard.html
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            dashboard: path.resolve(__dirname, 'dashboard.html')
          }
        }
      }
    };
});
