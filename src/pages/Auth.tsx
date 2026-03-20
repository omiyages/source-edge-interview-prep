
import { SignIn } from '@clerk/react';
import { useAuth } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-800 to-cyan-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60" />

        {/* Geometric background */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12" />
        <div className="absolute top-40 left-40 w-24 h-24 border border-white/15 rounded-lg rotate-45" />
        <div className="absolute top-60 left-32 w-16 h-16 border border-white/10 rounded-lg -rotate-12" />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="w-12 h-12 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Welcome to<br />
              Omiyages!
            </h1>
          </div>

          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Get prepared for your upcoming interviews through our database
            of past questions and certified tips.
          </p>

          <div className="absolute bottom-8 left-12 text-white/60 text-sm">
            © 2026 Omiyages. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side — Clerk SignIn */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <SignIn
          afterSignInUrl="/"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'bg-transparent shadow-none border-none p-0',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton: 'border border-border text-foreground hover:bg-accent',
              formFieldInput: 'bg-transparent border-border text-foreground',
              formButtonPrimary: 'bg-[#E4E4E4] text-neutral-950 hover:bg-[#D4D4D4]',
              footerActionLink: 'text-primary',
            },
          }}
        />
      </div>
    </div>
  );
};

export default Auth;
