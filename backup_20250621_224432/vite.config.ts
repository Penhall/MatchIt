// vite.config.ts - Configuração corrigida com aliases completos
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // ✅ ALIASES CORRIGIDOS - Mapeamento completo
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@components/common': path.resolve(__dirname, './src/components/common'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@screens': path.resolve(__dirname, './screens'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@types': path.resolve(__dirname, './src/types'),
      
      // Aliases alternativos para compatibilidade
      'src': path.resolve(__dirname, './src'),
      'screens': path.resolve(__dirname, './screens'),
      'components': path.resolve(__dirname, './src/components'),
      'context': path.resolve(__dirname, './src/context'),
      'services': path.resolve(__dirname, './src/services')
    }
  },
  
  // DEV mode (npm run dev)
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 15000
      }
    }
  },
  
  // PREVIEW mode (npm run preview)
  preview: {
    port: 4173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 15000
      }
    }
  },
  
  // ✅ BUILD CONFIGURADO PARA RESOLVER ALIASES
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    emptyOutDir: true,
    
    // Configuração do Rollup para resolver aliases
    rollupOptions: {
      // Não externalizar nenhum módulo local
      external: [],
      
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios']
        }
      }
    }
  },
  
  // Otimização de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'axios'
    ]
  }
});
