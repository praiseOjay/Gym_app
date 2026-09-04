import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import './index.css';
import App from './App.tsx';

// Apply native platform class for safe-area handling on mobile
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
  document.documentElement.classList.add(`platform-${Capacitor.getPlatform()}`);
}

// Register PWA service worker for offline capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA service worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
