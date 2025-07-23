
import React from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, UserCheck } from 'lucide-react';

interface KanbanFiltersProps {
  roleFilter: string;
  companyFilter: string;
  onRoleFilterChange: (value: string) => void;
  onCompanyFilterChange: (value: string) => void;
  availableRoles: string[];
  availableCompanies: string[];
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  roleFilter,
  companyFilter,
  onRoleFilterChange,
  onCompanyFilterChange,
  availableRoles,
  availableCompanies,
}) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="role-filter" className="text-sm font-medium text-muted-foreground">
            Filter by Role
          </Label>
          <div className="relative mt-1">
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger className="pl-10">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor="company-filter" className="text-sm font-medium text-muted-foreground">
            Filter by Company
          </Label>
          <div className="relative mt-1">
            <Select value={companyFilter} onValueChange={onCompanyFilterChange}>
              <SelectTrigger className="pl-10">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {availableCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};
