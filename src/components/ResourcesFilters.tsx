
import { Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateResourceForm } from "@/components/CreateResourceForm";

interface ResourcesFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isAdmin: boolean;
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  onCreateSuccess: () => void;
}

const categories = [
  "Interview Prep",
  "Technical Skills", 
  "Career Development",
  "Coding Practice",
  "System Design",
  "Behavioral Interview",
  "Other"
];

export const ResourcesFilters = ({
  selectedCategory,
  onCategoryChange,
  isAdmin,
  createDialogOpen,
  onCreateDialogOpenChange,
  onCreateSuccess
}: ResourcesFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
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
  );
};
