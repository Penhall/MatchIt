import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: [
      // Corrigir o problema de redirecionamento, garantindo que apenas 'react-native' seja redirecionado
      { find: /^react-native$/, replacement: 'react-native-web' },
      
      // Manter os outros aliases
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@components', replacement: path.resolve(__dirname, './src/components') },
      { find: '@context', replacement: path.resolve(__dirname, './src/context') },
      { find: '@services', replacement: path.resolve(__dirname, './src/services') },
      { find: '@hooks', replacement: path.resolve(__dirname, './src/hooks') },
      { find: '@screens', replacement: path.resolve(__dirname, './src/screens') },
      { find: '@utils', replacement: path.resolve(__dirname, './src/utils') },
      { find: '@types', replacement: path.resolve(__dirname, './src/types') },
    ]
  },
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  define: {
    global: 'globalThis',
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  }
});
