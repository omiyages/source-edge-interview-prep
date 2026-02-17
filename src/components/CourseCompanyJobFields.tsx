
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "@/services/rolesService";
import { useCompanyOptions } from "@/hooks/useCompanyOptions";

interface CourseCompanyJobFieldsProps {
  company: string;
  attachedJobs: string[];
  onCompanyChange: (company: string) => void;
  onAttachedJobsChange: (jobs: string[]) => void;
}

export const CourseCompanyJobFields = ({ 
  company, 
  attachedJobs, 
  onCompanyChange, 
  onAttachedJobsChange 
}: CourseCompanyJobFieldsProps) => {
  const [newJob, setNewJob] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [newCompanyValue, setNewCompanyValue] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const { companies, addCompany } = useCompanyOptions();

  // Fetch roles from the database
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Filter roles by the selected company (case-insensitive), only active roles
  const availableRoles = useMemo(() => {
    if (!company) return roles.filter((r) => r.status === 'active');
    return roles.filter(
      (r) => r.status === 'active' && r.company.toLowerCase() === company.toLowerCase()
    );
  }, [roles, company]);

  const addRoleFromDropdown = () => {
    if (!selectedRoleId) return;
    const role = roles.find((r) => r.id === selectedRoleId);
    if (!role) return;

    const label = role.job_title;
    if (!attachedJobs.includes(label)) {
      onAttachedJobsChange([...attachedJobs, label]);
    }
    setSelectedRoleId("");
  };

  const addCustomJob = () => {
    if (newJob.trim() && !attachedJobs.includes(newJob.trim())) {
      onAttachedJobsChange([...attachedJobs, newJob.trim()]);
      setNewJob("");
    }
  };

  const removeJob = (jobToRemove: string) => {
    onAttachedJobsChange(attachedJobs.filter(job => job !== jobToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomJob();
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyValue.trim()) return;
    setIsAddingCompany(true);
    const success = await addCompany(newCompanyValue);
    if (success) {
      onCompanyChange(newCompanyValue.trim());
      setShowAddCompanyDialog(false);
      setNewCompanyValue("");
    }
    setIsAddingCompany(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <div className="flex gap-2">
            <Select value={company} onValueChange={onCompanyChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((comp) => (
                  <SelectItem key={comp} value={comp}>
                    {comp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowAddCompanyDialog(true)}
              className="h-9 w-9 shrink-0"
              title="Add new company"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Attached Jobs</Label>

          {/* Dropdown to pick from existing roles */}
          {availableRoles.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={company ? `Select a role at ${company}` : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles
                    .filter((r) => !attachedJobs.includes(r.job_title))
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.job_title}{!company && ` — ${r.company}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRoleFromDropdown}
                disabled={!selectedRoleId}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Manual entry fallback */}
          <div className="flex gap-2">
            <Input
              value={newJob}
              onChange={(e) => setNewJob(e.target.value)}
              placeholder="Or type a custom job title"
              onKeyPress={handleKeyPress}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomJob}
              disabled={!newJob.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {attachedJobs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachedJobs.map((job, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {job}
                  <button
                    type="button"
                    onClick={() => removeJob(job)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add New Company Dialog */}
      <Dialog open={showAddCompanyDialog} onOpenChange={setShowAddCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-course-company-value">Company Name</Label>
              <Input
                id="new-course-company-value"
                value={newCompanyValue}
                onChange={(e) => setNewCompanyValue(e.target.value)}
                placeholder="Enter company name..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCompany();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddCompany}
                disabled={isAddingCompany || !newCompanyValue.trim()}
                className="flex-1"
              >
                {isAddingCompany ? "Adding..." : "Add Company"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCompanyDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
