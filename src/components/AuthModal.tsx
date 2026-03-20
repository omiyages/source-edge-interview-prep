
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useSignIn, useSignUp } from '@clerk/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<'signin' | 'signup'>('signin');

  const openSignIn = useCallback(() => { setInitialMode('signin'); setIsOpen(true); }, []);
  const openSignUp = useCallback(() => { setInitialMode('signup'); setIsOpen(true); }, []);

  return (
    <AuthModalContext.Provider value={{ openSignIn, openSignUp }}>
      {children}
      <AuthModalDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={initialMode}
      />
    </AuthModalContext.Provider>
  );
};

// ── SVG Brand Icons ───────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const OmiyagesIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5" aria-hidden>
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

// ── Modal Dialog ─────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup' | 'verify';

interface AuthModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'signup';
}

const OAUTH_PROVIDERS = [
  { strategy: 'oauth_google' as const,          Icon: GoogleIcon,   label: 'Google'   },
  { strategy: 'oauth_facebook' as const,         Icon: FacebookIcon, label: 'Facebook' },
  { strategy: 'oauth_linkedin_oidc' as const,    Icon: LinkedInIcon, label: 'LinkedIn' },
] as const;

const AuthModalDialog: React.FC<AuthModalDialogProps> = ({ isOpen, onClose, initialMode }) => {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Reset state whenever the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setCode('');
      setShowPw(false);
      setError('');
      setLoading(false);
      setOauthLoading(null);
    }
  }, [isOpen, initialMode]);

  const switchMode = (next: 'signin' | 'signup') => {
    setError('');
    setMode(next);
  };

  const clerkError = (err: unknown) => {
    const e = err as { errors?: { longMessage?: string; message?: string }[] };
    return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? 'Something went wrong.';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        onClose();
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setMode('verify');
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        onClose();
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (strategy: typeof OAUTH_PROVIDERS[number]['strategy']) => {
    if (!signInLoaded || !signIn) return;
    setOauthLoading(strategy);
    setError('');
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: '/',
      });
    } catch (err) {
      setError(clerkError(err));
      setOauthLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] bg-[#0d0d0d] border border-neutral-800/80 p-0 gap-0 shadow-2xl [&>button]:text-neutral-500 [&>button]:hover:text-neutral-200 [&>button]:transition-colors">
        <div className="flex flex-col items-center px-7 pt-8 pb-7">

          {/* Logo mark */}
          <div className="w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700/60 flex items-center justify-center mb-5 shadow-inner">
            <OmiyagesIcon />
          </div>

          {mode === 'verify' ? (
            /* ── Email Verification ── */
            <form onSubmit={handleVerify} className="w-full">
              <h2 className="text-base font-semibold text-white text-center mb-1">Check your email</h2>
              <p className="text-neutral-500 text-xs text-center mb-5 leading-relaxed">
                We sent a code to <span className="text-neutral-300">{email}</span>.{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-blue-500 hover:text-blue-400 transition-colors underline-offset-2">
                  Change
                </button>
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="bg-neutral-800/50 border-neutral-700/80 text-white placeholder:text-neutral-600 text-center text-2xl tracking-[0.6em] mb-4 h-12 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                maxLength={6}
                inputMode="numeric"
                required
              />
              {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}
              <Button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-blue-400/50 text-white font-semibold h-10 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify email'}
              </Button>
            </form>
          ) : (
            /* ── Sign In / Sign Up ── */
            <>
              <h2 className="text-base font-semibold text-white text-center mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-neutral-500 text-xs text-center mb-6">
                {mode === 'signin' ? (
                  <>Don't have an account?{' '}
                    <button type="button" onClick={() => switchMode('signup')} className="text-blue-500 hover:text-blue-400 transition-colors">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('signin')} className="text-blue-500 hover:text-blue-400 transition-colors">
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="w-full">
                {/* Email */}
                <div className="relative mb-2.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="bg-neutral-800/50 border-neutral-700/80 text-white placeholder:text-neutral-600 pl-9 h-10 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="relative mb-5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-neutral-800/50 border-neutral-700/80 text-white placeholder:text-neutral-600 pl-9 pr-10 h-10 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 mb-5 transition-colors"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative w-full mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0d0d0d] px-3 text-[11px] text-neutral-600 uppercase tracking-wider">or</span>
                </div>
              </div>

              {/* OAuth buttons — icon only to match the minimal dark design */}
              <div className="flex gap-2.5 w-full">
                {OAUTH_PROVIDERS.map(({ strategy, Icon, label }) => (
                  <button
                    key={strategy}
                    type="button"
                    onClick={() => handleOAuth(strategy)}
                    disabled={!!oauthLoading}
                    aria-label={`Continue with ${label}`}
                    title={`Continue with ${label}`}
                    className="flex-1 flex items-center justify-center h-10 rounded-lg border border-neutral-700/80 bg-neutral-800/40 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === strategy
                      ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      : <Icon />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModalProvider;
