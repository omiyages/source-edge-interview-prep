
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface CourseCompanyJobFieldsProps {
  company: string;
  attachedJobs: string[];
  onCompanyChange: (company: string) => void;
  onAttachedJobsChange: (jobs: string[]) => void;
}

const COMPANIES = [
  "Woven by Toyota",
  "Lexxpluss",
  "Wismettac"
];

export const CourseCompanyJobFields = ({ 
  company, 
  attachedJobs, 
  onCompanyChange, 
  onAttachedJobsChange 
}: CourseCompanyJobFieldsProps) => {
  const [newJob, setNewJob] = useState("");

  const addJob = () => {
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
      addJob();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Select value={company} onValueChange={onCompanyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {COMPANIES.map((comp) => (
              <SelectItem key={comp} value={comp}>
                {comp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attached-jobs">Attached Jobs</Label>
        <div className="flex gap-2">
          <Input
            value={newJob}
            onChange={(e) => setNewJob(e.target.value)}
            placeholder="Add a job title"
            onKeyPress={handleKeyPress}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addJob}
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
  );
};
