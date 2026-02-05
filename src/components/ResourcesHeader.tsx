import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateResourceForm } from "@/components/CreateResourceForm";
import { Plus } from "lucide-react";

interface ResourcesHeaderProps {
  isAdmin: boolean;
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  onCreateSuccess: () => void;
}

export const ResourcesHeader = ({ 
  isAdmin, 
  createDialogOpen, 
  onCreateDialogOpenChange, 
  onCreateSuccess 
}: ResourcesHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Interview Resources
        </h1>
          <p className="text-base text-muted-foreground">
            Curated guides, videos, and articles to help you ace your next technical or behavioral interview.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Create New Resource</DialogTitle>
              </DialogHeader>
              <CreateResourceForm onSuccess={onCreateSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
