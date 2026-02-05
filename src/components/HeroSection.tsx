import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { NavigationHeader } from "@/components/NavigationHeader";

interface HeroSectionProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

const HeroSection = memo(({ isAdmin, dialogOpen, setDialogOpen, onSubmitSuccess }: HeroSectionProps) => {
  const { profile } = useAuth();

  return (
    <>
      {/* Navigation Header */}
      <NavigationHeader />

      {/* Hero Content */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Updated Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Now Updated for 2026
              </span>
            </div>

            {/* Main Heading with "prepare" in italic */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              Real interview questions to help{' '}
              <span className="italic font-normal text-primary">prepare</span>{' '}
              for your next win.
            </h1>
            
            {/* Welcome Message */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || profile?.email}</span> 👋
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
          </div>
        </div>
      </div>
    </>
  );
});

HeroSection.displayName = 'HeroSection';

export { HeroSection };
