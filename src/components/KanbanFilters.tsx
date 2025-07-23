
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Search, Building2, UserCheck } from 'lucide-react';

interface KanbanFiltersProps {
  roleFilter: string;
  companyFilter: string;
  onRoleFilterChange: (value: string) => void;
  onCompanyFilterChange: (value: string) => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  roleFilter,
  companyFilter,
  onRoleFilterChange,
  onCompanyFilterChange,
}) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="role-filter" className="text-sm font-medium text-muted-foreground">
            Filter by Role
          </Label>
          <div className="relative mt-1">
            <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="role-filter"
              type="text"
              placeholder="Enter job title or role..."
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor="company-filter" className="text-sm font-medium text-muted-foreground">
            Filter by Company
          </Label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="company-filter"
              type="text"
              placeholder="Enter company name..."
              value={companyFilter}
              onChange={(e) => onCompanyFilterChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
