
import React, { Suspense, createContext, lazy, useCallback, useContext, useState } from 'react';

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthModalContextType {
  openSignIn: () => void;
  openSignUp: () => void;
}

export const AuthModalContext = createContext<AuthModalContextType>({
  openSignIn: () => {},
  openSignUp: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

const AuthModalDialog = lazy(() => import('@/components/AuthModalDialog'));

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<'signin' | 'signup'>('signin');

  const openSignIn = useCallback(() => { setInitialMode('signin'); setIsOpen(true); }, []);
  const openSignUp = useCallback(() => { setInitialMode('signup'); setIsOpen(true); }, []);

  return (
    <AuthModalContext.Provider value={{ openSignIn, openSignUp }}>
      {children}
      <Suspense fallback={null}>
        {isOpen && (
          <AuthModalDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            initialMode={initialMode}
          />
        )}
      </Suspense>
    </AuthModalContext.Provider>
  );
};

export default AuthModalProvider;
