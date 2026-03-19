import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { NavigationHeader } from "@/components/NavigationHeader";

interface HeroSectionProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

const dotGridStyle: React.CSSProperties = {
  backgroundColor: '#0A0C0F',
  backgroundImage: 'radial-gradient(circle, #1E2329 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const gradientFadeStyle: React.CSSProperties = {
  background: 'linear-gradient(to bottom, transparent 50%, #0a0a0b 100%)',
};

const HeroSection = memo(({ isAdmin, dialogOpen, setDialogOpen, onSubmitSuccess }: HeroSectionProps) => {
  const { profile, user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

  return (
    <>
      {/* Navigation Header */}
      <NavigationHeader />

      {/* Hero Content */}
      <div className="relative" style={dotGridStyle}>
        {/* Gradient fade overlay */}
        <div className="absolute inset-0 pointer-events-none" style={gradientFadeStyle} />
        <div className="relative container mx-auto px-4 py-14 md:py-20 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Updated Badge */}
            <div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Updated for 2026
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[1.15] tracking-tight">
              Real interview questions to help{' '}
              <span className="italic font-normal text-primary">prepare</span>{' '}
              for your next win.
            </h1>
            
            {authLoading ? (
              <>
                {/* Neutral placeholder while auth loads — no flash */}
                <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Browse our curated database of real interview questions from top companies.
                </p>
                <div className="h-11" /> {/* spacer matching button height */}
              </>
            ) : isAuthenticated ? (
              <>
                {/* Welcome Message for logged-in users */}
                <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || profile?.email}</span>
                  {isAdmin && <span className="text-primary font-semibold ml-1">Admin</span>}
                  . Ready to prepare for your upcoming interview?
                </p>

                {/* Submit Question Button */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      variant="gradient"
                      className="px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Submit Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Submit New Interview Question</DialogTitle>
                    </DialogHeader>
                    <SubmitQuestionForm onSuccess={onSubmitSuccess} onCancel={() => setDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                {/* Description for logged-out users */}
                <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Browse our curated database of real interview questions from top companies. Sign in to unlock all questions, detailed coaching, and track your progress.
                </p>

                {/* Sign In / Register Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button asChild size="lg" variant="gradient" className="px-8 py-3 rounded-lg">
                    <Link to="/auth">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8 py-3 rounded-lg border-neutral-600 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-500">
                    <Link to="/signup">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Register
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

HeroSection.displayName = 'HeroSection';

export { HeroSection };
