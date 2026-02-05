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
        <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal text-foreground mb-6 leading-tight">
            Real interview questions to help you prepare for your next opportunity
          </h2>
          
          <p className="text-base text-muted-foreground mb-8">
            Welcome back, {profile?.full_name || profile?.email} 👋
            {isAdmin && <span className="text-primary font-semibold ml-2">👑 Admin</span>}
          </p>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                variant="gradient"
                className="px-8 py-3 rounded-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit New Interview Question</DialogTitle>
              </DialogHeader>
              <SubmitQuestionForm onSuccess={onSubmitSuccess} />
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
