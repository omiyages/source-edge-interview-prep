
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateResourceForm } from "@/components/CreateResourceForm";
import { Plus } from "lucide-react";

interface ResourcesFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isAdmin: boolean;
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  onCreateSuccess: () => void;
}

export const ResourcesFilters = ({ 
  selectedCategory, 
  onCategoryChange, 
  isAdmin, 
  createDialogOpen, 
  onCreateDialogOpenChange, 
  onCreateSuccess 
}: ResourcesFiltersProps) => {
  const categories = [
    "all",
    "Interview Prep",
    "Technical Skills", 
    "Career Development",
    "Coding Practice",
    "System Design",
    "Behavioral Interview",
    "Other"
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-4">
        <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
          Filter by category:
        </label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
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
  );
};
