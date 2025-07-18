// vite.config.js - Configuração do Vite corrigida para compatibilidade React Native Web
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      // Aliases principais
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@assets': path.resolve(__dirname, './src/assets'),
      
      // Aliases para compatibilidade React Native → Web
      'react-native': path.resolve(__dirname, './src/lib/react-native-web'),
      'react-native-safe-area-context': path.resolve(__dirname, './src/lib/react-native-web'),
      '@react-navigation/native': path.resolve(__dirname, './src/lib/react-native-web'),
      
      // Outros packages React Native que podem aparecer
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './src/lib/react-native-web/AsyncStorage'),
      'react-native-chart-kit': path.resolve(__dirname, './src/lib/react-native-web'),
      '@react-native-community/slider': path.resolve(__dirname, './src/lib/react-native-web'),
      'expo-linear-gradient': path.resolve(__dirname, './src/lib/react-native-web/LinearGradient'),
      '@expo/vector-icons': path.resolve(__dirname, './src/lib/react-native-web/Icons'),
      'expo-haptics': path.resolve(__dirname, './src/lib/react-native-web/Haptics')
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
          proxy.on('error', (err) => {
            console.error('🔴 Erro de proxy - Backend não está rodando na porta 3000');
            console.error('   Execute: npm run server');
          });
        }
      }
    }
  },
  
  define: {
    // Variáveis globais necessárias
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    global: 'globalThis',
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000/api')
  },
  
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `
          /* Animações necessárias para os componentes */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Estilos básicos para compatibilidade */
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
          }
          
          /* Esconder scrollbars quando necessário */
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }
    }
  },
  
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          'react-native-web': ['./src/lib/react-native-web']
        }
      }
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: [
      // Excluir packages React Native que não existem
      'react-native',
      'expo-linear-gradient',
      '@expo/vector-icons',
      'expo-haptics'
    ]
  }
});