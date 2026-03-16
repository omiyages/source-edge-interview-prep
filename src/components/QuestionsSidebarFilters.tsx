import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

interface QuestionsSidebarFiltersProps {
  filters: {
    company: string[];
    category: string[];
    role: string[];
    stage: string[];
  };
  onFilterChange: (filterType: string, values: string[]) => void;
  onClearFilters: () => void;
  companies: { company: string; count: number }[];
  categories: string[];
  roles: { role: string; count: number }[];
  stages: { stage: string; count: number }[];
}

export const QuestionsSidebarFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  companies,
  categories,
  roles,
  stages,
}: QuestionsSidebarFiltersProps) => {
  const [topicOpen, setTopicOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");

  const handleCheckboxChange = (filterType: string, value: string, checked: boolean) => {
    const currentValues = filters[filterType as keyof typeof filters];
    if (checked) {
      onFilterChange(filterType, [...currentValues, value]);
    } else {
      onFilterChange(filterType, currentValues.filter(v => v !== value));
    }
  };

  const handleCompanyChange = (value: string) => {
    if (value === "all") {
      onFilterChange('company', []);
    } else {
      onFilterChange('company', [value]);
    }
  };

  const hasActiveFilters = 
    filters.company.length > 0 ||
    filters.category.length > 0 ||
    filters.role.length > 0 ||
    filters.stage.length > 0;

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Menu className="w-4 h-4" />
          Filters
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs h-7"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status Section - Removed as we don't track solved/unsolved status */}

      {/* Difficulty Section - Removed as we don't have difficulty field in database */}

      {/* Company Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Company</h3>
        <Select
          value={filters.company.length > 0 ? filters.company[0] : "all"}
          onValueChange={handleCompanyChange}
        >
          <SelectTrigger className="w-full border-neutral-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(({ company, count }) => (
              <SelectItem key={company} value={company}>
                {company} ({count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Role</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {roles.map(({ role, count }) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                id={`role-${role}`}
                checked={filters.role.includes(role)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('role', role, checked as boolean)
                }
                className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`role-${role}`}
                className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{role}</span>
                <span className="text-xs text-muted-foreground ml-2">{count}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Stage</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stages.map(({ stage, count }) => (
            <div key={stage} className="flex items-center space-x-2">
              <Checkbox
                id={`stage-${stage}`}
                checked={filters.stage.includes(stage)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('stage', stage, checked as boolean)
                }
                className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`stage-${stage}`}
                className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{stage}</span>
                <span className="text-xs text-muted-foreground ml-2">{count}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Topic/Category Section */}
      <div>
        <Collapsible open={topicOpen} onOpenChange={setTopicOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full mb-3">
            <h3 className="text-sm font-medium text-foreground">Topic</h3>
            {topicOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="relative mb-3">
              <Input
                placeholder="Search topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories
                .filter((category) => category.toLowerCase().includes(topicSearch.toLowerCase()))
                .map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.category.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('category', category, checked as boolean)
                      }
                      className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

