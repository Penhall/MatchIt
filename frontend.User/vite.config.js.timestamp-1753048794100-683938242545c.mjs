// vite.config.js
import { defineConfig } from "file:///mnt/d/PYTHON/MatchIt/frontend.User/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/d/PYTHON/MatchIt/frontend.User/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/mnt/d/PYTHON/MatchIt/frontend.User";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Aliases principais
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@components": path.resolve(__vite_injected_original_dirname, "./src/components"),
      "@context": path.resolve(__vite_injected_original_dirname, "./src/context"),
      "@services": path.resolve(__vite_injected_original_dirname, "./src/services"),
      "@hooks": path.resolve(__vite_injected_original_dirname, "./src/hooks"),
      "@utils": path.resolve(__vite_injected_original_dirname, "./src/utils"),
      "@screens": path.resolve(__vite_injected_original_dirname, "./src/screens"),
      "@assets": path.resolve(__vite_injected_original_dirname, "./src/assets"),
      // Aliases para compatibilidade React Native → Web
      "react-native": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web"),
      "react-native-safe-area-context": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web"),
      "@react-navigation/native": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web"),
      // Outros packages React Native que podem aparecer
      "@react-native-async-storage/async-storage": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web/AsyncStorage"),
      "react-native-chart-kit": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web"),
      "@react-native-community/slider": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web"),
      "expo-linear-gradient": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web/LinearGradient"),
      "@expo/vector-icons": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web/Icons"),
      "expo-haptics": path.resolve(__vite_injected_original_dirname, "./src/lib/react-native-web/Haptics")
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("\u{1F534} Erro de proxy - Backend n\xE3o est\xE1 rodando na porta 3000");
            console.error("   Execute: npm run server");
          });
        }
      }
    }
  },
  define: {
    // Variáveis globais necessárias
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    global: "globalThis",
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || "http://localhost:3000/api")
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `
          /* Anima\xE7\xF5es necess\xE1rias para os componentes */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Estilos b\xE1sicos para compatibilidade */
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
          
          /* Esconder scrollbars quando necess\xE1rio */
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
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          "react-native-web": ["./src/lib/react-native-web"]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom"
    ],
    exclude: [
      // Excluir packages React Native que não existem
      "react-native",
      "expo-linear-gradient",
      "@expo/vector-icons",
      "expo-haptics"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvUFlUSE9OL01hdGNoSXQvZnJvbnRlbmQuVXNlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9kL1BZVEhPTi9NYXRjaEl0L2Zyb250ZW5kLlVzZXIvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9kL1BZVEhPTi9NYXRjaEl0L2Zyb250ZW5kLlVzZXIvdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qcyAtIENvbmZpZ3VyYVx1MDBFN1x1MDBFM28gZG8gVml0ZSBjb3JyaWdpZGEgcGFyYSBjb21wYXRpYmlsaWRhZGUgUmVhY3QgTmF0aXZlIFdlYlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgLy8gQWxpYXNlcyBwcmluY2lwYWlzXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgJ0Bjb21wb25lbnRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2NvbXBvbmVudHMnKSxcbiAgICAgICdAY29udGV4dCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb250ZXh0JyksXG4gICAgICAnQHNlcnZpY2VzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3NlcnZpY2VzJyksXG4gICAgICAnQGhvb2tzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2hvb2tzJyksXG4gICAgICAnQHV0aWxzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3V0aWxzJyksXG4gICAgICAnQHNjcmVlbnMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvc2NyZWVucycpLFxuICAgICAgJ0Bhc3NldHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvYXNzZXRzJyksXG4gICAgICBcbiAgICAgIC8vIEFsaWFzZXMgcGFyYSBjb21wYXRpYmlsaWRhZGUgUmVhY3QgTmF0aXZlIFx1MjE5MiBXZWJcbiAgICAgICdyZWFjdC1uYXRpdmUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWInKSxcbiAgICAgICdyZWFjdC1uYXRpdmUtc2FmZS1hcmVhLWNvbnRleHQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWInKSxcbiAgICAgICdAcmVhY3QtbmF2aWdhdGlvbi9uYXRpdmUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWInKSxcbiAgICAgIFxuICAgICAgLy8gT3V0cm9zIHBhY2thZ2VzIFJlYWN0IE5hdGl2ZSBxdWUgcG9kZW0gYXBhcmVjZXJcbiAgICAgICdAcmVhY3QtbmF0aXZlLWFzeW5jLXN0b3JhZ2UvYXN5bmMtc3RvcmFnZSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9saWIvcmVhY3QtbmF0aXZlLXdlYi9Bc3luY1N0b3JhZ2UnKSxcbiAgICAgICdyZWFjdC1uYXRpdmUtY2hhcnQta2l0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2xpYi9yZWFjdC1uYXRpdmUtd2ViJyksXG4gICAgICAnQHJlYWN0LW5hdGl2ZS1jb21tdW5pdHkvc2xpZGVyJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2xpYi9yZWFjdC1uYXRpdmUtd2ViJyksXG4gICAgICAnZXhwby1saW5lYXItZ3JhZGllbnQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWIvTGluZWFyR3JhZGllbnQnKSxcbiAgICAgICdAZXhwby92ZWN0b3ItaWNvbnMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWIvSWNvbnMnKSxcbiAgICAgICdleHBvLWhhcHRpY3MnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWIvSGFwdGljcycpXG4gICAgfVxuICB9LFxuICBcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gICAgXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHVEODNEXHVERDM0IEVycm8gZGUgcHJveHkgLSBCYWNrZW5kIG5cdTAwRTNvIGVzdFx1MDBFMSByb2RhbmRvIG5hIHBvcnRhIDMwMDAnKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIEV4ZWN1dGU6IG5wbSBydW4gc2VydmVyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFxuICBkZWZpbmU6IHtcbiAgICAvLyBWYXJpXHUwMEUxdmVpcyBnbG9iYWlzIG5lY2Vzc1x1MDBFMXJpYXNcbiAgICBfX0RFVl9fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyksXG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgX19BUElfVVJMX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2FwaScpXG4gIH0sXG4gIFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBjc3M6IHtcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IGBcbiAgICAgICAgICAvKiBBbmltYVx1MDBFN1x1MDBGNWVzIG5lY2Vzc1x1MDBFMXJpYXMgcGFyYSBvcyBjb21wb25lbnRlcyAqL1xuICAgICAgICAgIEBrZXlmcmFtZXMgc3BpbiB7XG4gICAgICAgICAgICAwJSB7IHRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9XG4gICAgICAgICAgICAxMDAlIHsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvKiBFc3RpbG9zIGJcdTAwRTFzaWNvcyBwYXJhIGNvbXBhdGliaWxpZGFkZSAqL1xuICAgICAgICAgICoge1xuICAgICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgJ1JvYm90bycsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xuICAgICAgICAgICAgY29sb3I6ICNmZmZmZmY7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8qIEVzY29uZGVyIHNjcm9sbGJhcnMgcXVhbmRvIG5lY2Vzc1x1MDBFMXJpbyAqL1xuICAgICAgICAgIC5uby1zY3JvbGxiYXIge1xuICAgICAgICAgICAgLW1zLW92ZXJmbG93LXN0eWxlOiBub25lO1xuICAgICAgICAgICAgc2Nyb2xsYmFyLXdpZHRoOiBub25lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAubm8tc2Nyb2xsYmFyOjotd2Via2l0LXNjcm9sbGJhciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICAgIH1cbiAgICAgICAgYFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgcm91dGVyOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAncmVhY3QtbmF0aXZlLXdlYic6IFsnLi9zcmMvbGliL3JlYWN0LW5hdGl2ZS13ZWInXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAvLyBFeGNsdWlyIHBhY2thZ2VzIFJlYWN0IE5hdGl2ZSBxdWUgblx1MDBFM28gZXhpc3RlbVxuICAgICAgJ3JlYWN0LW5hdGl2ZScsXG4gICAgICAnZXhwby1saW5lYXItZ3JhZGllbnQnLFxuICAgICAgJ0BleHBvL3ZlY3Rvci1pY29ucycsXG4gICAgICAnZXhwby1oYXB0aWNzJ1xuICAgIF1cbiAgfVxufSk7Il0sCiAgIm1hcHBp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
