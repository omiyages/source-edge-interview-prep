
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface QuestionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    company: string;
    role: string;
    category: string;
    interview_stage: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onClearFilters: () => void;
  getUniqueValues: (field: string) => string[];
  resultCount: number;
}

export const QuestionFilters = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  getUniqueValues,
  resultCount
}: QuestionFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted rounded-md">
        <Select 
          value={filters.company} 
          onValueChange={(value) => onFilterChange('company', value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Companies</SelectItem>
            {getUniqueValues('company').map((company) => (
              <SelectItem key={company} value={company}>{company}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.role} 
          onValueChange={(value) => onFilterChange('role', value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Roles</SelectItem>
            {getUniqueValues('role').map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.category} 
          onValueChange={(value) => onFilterChange('category', value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Categories</SelectItem>
            {getUniqueValues('category').map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.interview_stage} 
          onValueChange={(value) => onFilterChange('interview_stage', value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Stages</SelectItem>
            {getUniqueValues('interview_stage').map((stage) => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="md:col-span-4 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </span>
          <Button 
            type="button"
            variant="outline" 
            onClick={onClearFilters} 
            size="sm"
            className="text-xs h-6"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
