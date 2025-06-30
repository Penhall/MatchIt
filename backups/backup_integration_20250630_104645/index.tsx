
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/i18n';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import './global.d.ts'; // Ensure global types are recognized, though typically not imported directly

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
