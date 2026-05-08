import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const CreateResourceForm = lazy(() =>
  import("@/components/CreateResourceForm").then((module) => ({ default: module.CreateResourceForm }))
);

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
            Curated guides, videos, and articles to help English-speaking and bilingual candidates prepare for software, ML, product, and technical interviews in Japan.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-neutral-900">
              <DialogHeader>
                <DialogTitle>Create New Resource</DialogTitle>
              </DialogHeader>
              <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading resource form…</div>}>
                <CreateResourceForm onSuccess={onCreateSuccess} />
              </Suspense>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
