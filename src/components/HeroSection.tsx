
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { BookOpen, MapPin, Settings, Plus } from "lucide-react";

interface HeroSectionProps {
  isAdmin: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

export const HeroSection = ({ isAdmin, dialogOpen, setDialogOpen, onSubmitSuccess }: HeroSectionProps) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
        Source Edge Interview Prep
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-8">
        Prepare for your upcoming interview by reviewing past interview questions and tips
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link to="/resources">
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Resources
          </Button>
        </Link>
        <Link to="/track/1">
          <Button variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            View Tracks
          </Button>
        </Link>
        {isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Dashboard
            </Button>
          </Link>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Share Your Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Interview Question</DialogTitle>
            </DialogHeader>
            <SubmitQuestionForm onSuccess={onSubmitSuccess} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
