import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: false,
    
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔴 Proxy Error:', err.message);
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🚀 Proxy Request:', req.method, req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            const emoji = proxyRes.statusCode < 400 ? '✅' : '🔴';
            console.log(`${emoji} Proxy Response:`, proxyRes.statusCode, req.url);
          });
        }
      },
      
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
