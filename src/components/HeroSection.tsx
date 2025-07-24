
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, LogOut, BookOpen, Settings, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroSectionProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

const HeroSection = memo(({ isAdmin, dialogOpen, setDialogOpen, onSubmitSuccess }: HeroSectionProps) => {
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavigationItems = () => (
    <>
      {!isAdmin && (
        <Link to="/dashboard">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            <BookOpen className="w-4 h-4 mr-2" />
            My Dashboard
          </Button>
        </Link>
      )}
      <Link to="/tracks">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
          <BookOpen className="w-4 h-4 mr-2" />
          Tracks
        </Button>
      </Link>
      <Link to="/resources">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
          Resources
        </Button>
      </Link>
      {isAdmin && (
        <Link to="/admin">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </Link>
      )}
      <Button 
        variant="ghost" 
        onClick={signOut} 
        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </>
  );

  return (
    <div className="bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-foreground">
              Source Edge Database
            </h1>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="flex items-center gap-1">
                <NavigationItems />
              </nav>
            )}
            
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-2 mt-8">
                    <NavigationItems />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal text-foreground mb-6 leading-tight">
            Real interview questions to help you prepare for your next opportunity
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            The modern interview preparation experience everyone deserves.
            You don't have to choose between comprehensive and user-friendly.
          </p>
          
          <p className="text-base text-muted-foreground mb-8">
            Welcome back, {profile?.full_name || profile?.email} 👋
            {isAdmin && <span className="text-primary font-semibold ml-2">👑 Admin</span>}
          </p>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 rounded-md transition-all duration-200 hover:shadow-lg"
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
  );
});

HeroSection.displayName = 'HeroSection';

export { HeroSection };
