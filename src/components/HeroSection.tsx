
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
          <Button variant="outline" className="hover-purple-lift w-full sm:w-auto">
            <BookOpen className="w-4 h-4 mr-2" />
            My Dashboard
          </Button>
        </Link>
      )}
      <Link to="/tracks">
        <Button variant="outline" className="hover-purple-lift w-full sm:w-auto">
          <BookOpen className="w-4 h-4 mr-2" />
          Tracks
        </Button>
      </Link>
      <Link to="/resources">
        <Button variant="outline" className="hover-purple-lift w-full sm:w-auto">
          Resources
        </Button>
      </Link>
      {isAdmin && (
        <Link to="/admin">
          <Button 
            variant="outline" 
            className="bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 w-full sm:w-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        </Link>
      )}
      <Button variant="outline" onClick={signOut} className="hover-purple-lift w-full sm:w-auto">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </>
  );

  return (
    <div className="text-center mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground pl-4">
          Source Edge Database
        </h1>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex gap-2">
            <NavigationItems />
          </div>
        )}
        
        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="mr-4">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <NavigationItems />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      
      <p className="text-[2rem] text-gray-600 pt-[30px] mb-[10px] px-4">
        Real interview questions to help you prepare for your next opportunity.
      </p>
      <p className="text-xs sm:text-sm text-gray-500 mb-6 px-4">
        Welcome back, {profile?.full_name?.split(' ')[0] || profile?.email} 👋
        {isAdmin && <span className="text-purple-600 font-semibold ml-2">👑 Admin</span>}
      </p>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium px-4 sm:px-6 py-3">
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
  );
});

HeroSection.displayName = 'HeroSection';

export { HeroSection };
