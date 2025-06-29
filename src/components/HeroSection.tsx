
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogOut, Settings, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";

interface HeroSectionProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

export const HeroSection = ({ isAdmin, dialogOpen, setDialogOpen, onSubmitSuccess }: HeroSectionProps) => {
  const { signOut, profile } = useAuth();

  console.log('🏠 HeroSection render:', { 
    isAdmin, 
    profileRole: profile?.role, 
    profileExists: !!profile 
  });

  return (
    <div className="text-center mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-purple-gradient">
          Source Edge Database
        </h1>
        <div className="flex gap-2">
          <Link to="/tracks">
            <Button variant="outline" className="hover-purple-lift">
              <BookOpen className="w-4 h-4 mr-2" />
              Tracks
            </Button>
          </Link>
          <Link to="/resources">
            <Button variant="outline" className="hover-purple-lift">
              <Users className="w-4 h-4 mr-2" />
              Resources
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={signOut} className="hover-purple-lift">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      <p className="text-lg text-gray-600 mb-4">
        Real interview questions from top companies to help you prepare for your next opportunity.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Welcome back, {profile?.email} ({profile?.role})
        {isAdmin && <span className="text-purple-600 font-semibold ml-2">👑 Admin</span>}
      </p>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium px-6 py-3">
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
};
