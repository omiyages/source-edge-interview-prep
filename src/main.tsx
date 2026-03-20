
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
const clerkAppearance = {
  elements: {
    card: 'bg-white shadow-2xl rounded-2xl border border-neutral-200',
    headerTitle: 'text-neutral-900 font-bold',
    headerSubtitle: 'text-neutral-500',
    socialButtonsBlockButton: 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 font-medium',
    socialButtonsBlockButtonText: 'text-neutral-700 font-medium',
    socialButtonsBlockButtonArrow: 'text-neutral-400',
    formFieldLabel: 'text-neutral-700 font-medium',
    formFieldInput: 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500',
    formButtonPrimary: 'bg-neutral-900 text-white hover:bg-neutral-700 font-semibold',
    footerActionLink: 'text-blue-600 font-medium hover:text-blue-700',
    footerActionText: 'text-neutral-500',
    dividerLine: 'bg-neutral-200',
    dividerText: 'text-neutral-400',
    formFieldInputShowPasswordButton: 'text-neutral-400 hover:text-neutral-600',
    identityPreviewText: 'text-neutral-700',
    identityPreviewEditButton: 'text-blue-600',
    alertText: 'text-red-600',
    otpCodeFieldInput: 'border-neutral-300 text-neutral-900',
    badge: 'bg-neutral-100 text-neutral-600',
  },
};

root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/auth"
      appearance={clerkAppearance}
    >
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ClerkProvider>
  </StrictMode>
);
