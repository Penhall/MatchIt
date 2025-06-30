import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      // Aliases normais
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@screens': path.resolve(__dirname, './screens'),
      '@assets': path.resolve(__dirname, './src/assets'),
      
      // ALIASES PARA COMPATIBILIDADE REACT NATIVE
      'react-native': path.resolve(__dirname, './src/lib/react-native-web'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './src/lib/react-native-web/AsyncStorage'),
      'react-native-safe-area-context': path.resolve(__dirname, './src/lib/react-native-web'),
      '@react-navigation/native': path.resolve(__dirname, './src/lib/react-native-web'),
      'react-native-chart-kit': path.resolve(__dirname, './src/lib/react-native-web'),
      '@react-native-community/slider': path.resolve(__dirname, './src/lib/react-native-web')
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => {
            console.error('🔴 Backend não está na porta 3000 - Execute: npm run server');
          });
        }
      }
    }
  },
  
  define: {
    __API_URL__: JSON.stringify('http://localhost:3000/api'),
    // Definir variáveis globais para React Native
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    global: 'globalThis'
  },
  
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
});
