
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/auth">
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ClerkProvider>
  </StrictMode>
);
