import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

interface ResourcesFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resources: Resource[];
}

export const ResourcesFilters = ({ 
  selectedCategory, 
  onCategoryChange,
  searchTerm,
  onSearchChange,
  resources
}: ResourcesFiltersProps) => {
  const allCategories = [
    "all",
    "System Design",
    "Behavioral",
    "Algorithms",
    "Frontend",
    "Backend",
    "Interview Prep",
    "Technical Skills", 
    "Career Development",
    "Coding Practice",
    "Other"
  ];

  // Count resources per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCategories.forEach(category => {
      if (category === "all") {
        counts[category] = resources.length;
      } else {
        counts[category] = resources.filter(r => r.category === category).length;
      }
    });
    return counts;
  }, [resources]);

  // Filter out categories with 0 resources (except "all")
  const categories = useMemo(() => {
    return allCategories.filter(category => {
      if (category === "all") return true; // Always show "All"
      return categoryCounts[category] > 0;
    });
  }, [categoryCounts]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className={
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white hover:bg-gray-50"
              }
            >
              {category === "all" ? "All" : category}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
