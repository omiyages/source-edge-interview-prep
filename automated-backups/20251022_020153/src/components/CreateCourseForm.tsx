
// ABOUTME: Form component that provides options to create a new course or copy an existing one
// ABOUTME: Includes toggle functionality between create new and copy modes

import { useState } from "react";
import { CreateCourseWorkflow } from "./CreateCourseWorkflow";
import { CopyCourseForm } from "./CopyCourseForm";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const [mode, setMode] = useState<'create' | 'copy'>('create');

  return (
    <div className="w-full space-y-6">
      {/* Mode Selection */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={mode === 'create' ? 'default' : 'ghost'}
          onClick={() => setMode('create')}
          className="flex-1"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Course
        </Button>
        <Button
          variant={mode === 'copy' ? 'default' : 'ghost'}
          onClick={() => setMode('copy')}
          className="flex-1"
          size="sm"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Existing Course
        </Button>
      </div>

      {/* Content based on mode */}
      {mode === 'create' ? (
        <CreateCourseWorkflow onSuccess={onSuccess} />
      ) : (
        <CopyCourseForm onSuccess={onSuccess} />
      )}
    </div>
  );
};
