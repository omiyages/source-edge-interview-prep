import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

interface RolesSidebarFiltersProps {
  filters: {
    company: string;
    divisions: string[];
    roleTypes: string[];
    locations: string[];
    styles: string[];
    status: string;
  };
  onCompanyChange: (value: string) => void;
  onDivisionToggle: (value: string) => void;
  onRoleTypeToggle: (value: string) => void;
  onLocationToggle: (value: string) => void;
  onStyleToggle: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  companies: [string, number][];
  divisions: [string, number][];
  roleTypes: [string, number][];
  locations: [string, number][];
  styles: [string, number][];
  isAdmin: boolean;
}

export const RolesSidebarFilters = ({
  filters,
  onCompanyChange,
  onDivisionToggle,
  onRoleTypeToggle,
  onLocationToggle,
  onStyleToggle,
  onStatusChange,
  onClearFilters,
  companies,
  divisions,
  roleTypes,
  locations,
  styles,
  isAdmin,
}: RolesSidebarFiltersProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters =
    filters.company !== 'all' ||
    filters.divisions.length > 0 ||
    filters.roleTypes.length > 0 ||
    filters.locations.length > 0 ||
    filters.styles.length > 0 ||
    (isAdmin && filters.status !== 'all');

  return (
    <div className="bg-neutral-900 rounded-lg border border-border shadow-sm p-4 sticky top-4">
      <button
        type="button"
        className="flex items-center justify-between w-full mb-4 lg:cursor-default"
        onClick={() => setFiltersOpen((v) => !v)}
      >
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Menu className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {filters.divisions.length + filters.roleTypes.length + filters.locations.length + filters.styles.length + (filters.company !== 'all' ? 1 : 0)}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onClearFilters(); }}
              className="text-xs h-7 hidden lg:inline-flex"
            >
              Clear All
            </Button>
          )}
          <span className="lg:hidden text-muted-foreground">
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-xs h-7 mb-3 lg:hidden"
        >
          Clear All
        </Button>
      )}

      {/* Company */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Company</h3>
        <Select value={filters.company} onValueChange={onCompanyChange}>
          <SelectTrigger className="w-full border-neutral-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(([company, count]) => (
              <SelectItem key={company} value={company}>
                {company} ({count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Type */}
      {roleTypes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Role Type</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {roleTypes.map(([roleType, count]) => (
              <div key={roleType} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-type-${roleType}`}
                  checked={filters.roleTypes.includes(roleType)}
                  onCheckedChange={() => onRoleTypeToggle(roleType)}
                  className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`role-type-${roleType}`}
                  className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                >
                  <span>{roleType}</span>
                  <span className="text-xs text-muted-foreground ml-2">{count}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {locations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Location</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {locations.map(([location, count]) => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={`loc-${location}`}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={() => onLocationToggle(location)}
                  className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`loc-${location}`}
                  className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                >
                  <span>{location}</span>
                  <span className="text-xs text-muted-foreground ml-2">{count}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Working Style */}
      {styles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Working Style</h3>
          <div className="space-y-2">
            {styles.map(([style, count]) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={`style-${style}`}
                  checked={filters.styles.includes(style)}
                  onCheckedChange={() => onStyleToggle(style)}
                  className="border-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`style-${style}`}
                  className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                >
                  <span>{style}</span>
                  <span className="text-xs text-muted-foreground ml-2">{count}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Division and Status filters intentionally hidden per current UX request */}
      </div>
    </div>
  );
};
