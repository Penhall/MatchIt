import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@screens': path.resolve(__dirname, './screens'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error: Backend não está rodando na porta 3000');
            console.error('🔧 Execute: npm run server');
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 Proxy:', req.method, req.url, '→ http://localhost:3000');
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '❌';
            console.log(`${emoji} [${proxyRes.statusCode}]:`, req.url);
          });
        }
      },
      
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  
  define: {
    __API_URL__: JSON.stringify('http://localhost:3000/api'),
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
});
