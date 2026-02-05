import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

interface QuestionsSidebarFiltersProps {
  filters: {
    company: string[];
    category: string[];
  };
  onFilterChange: (filterType: string, values: string[]) => void;
  onClearFilters: () => void;
  companies: { company: string; count: number }[];
  categories: string[];
}

export const QuestionsSidebarFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  companies,
  categories,
}: QuestionsSidebarFiltersProps) => {
  const [companySearch, setCompanySearch] = useState("");
  const [topicOpen, setTopicOpen] = useState(false);

  const handleCheckboxChange = (filterType: string, value: string, checked: boolean) => {
    const currentValues = filters[filterType as keyof typeof filters];
    if (checked) {
      onFilterChange(filterType, [...currentValues, value]);
    } else {
      onFilterChange(filterType, currentValues.filter(v => v !== value));
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.company.toLowerCase().includes(companySearch.toLowerCase())
  );

  const hasActiveFilters = 
    filters.company.length > 0 ||
    filters.category.length > 0;

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-4 sticky top-4">
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
        <div className="relative mb-3">
          <Input
            placeholder="Search companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredCompanies.map(({ company, count }) => (
            <div key={company} className="flex items-center space-x-2">
              <Checkbox
                id={`company-${company}`}
                checked={filters.company.includes(company)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('company', company, checked as boolean)
                }
              />
              <Label
                htmlFor={`company-${company}`}
                className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{company}</span>
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
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.category.includes(category)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('category', category, checked as boolean)
                    }
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

