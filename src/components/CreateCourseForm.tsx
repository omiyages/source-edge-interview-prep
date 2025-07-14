
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Copy } from "lucide-react";
import { CreateCourseWorkflow } from "./CreateCourseWorkflow";
import { CopyCourseForm } from "./CopyCourseForm";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  return (
    <Tabs defaultValue="workflow" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="workflow" className="flex items-center gap-2">
          <Workflow className="w-4 h-4" />
          Full Setup
        </TabsTrigger>
        <TabsTrigger value="copy" className="flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Copy Course
        </TabsTrigger>
      </TabsList>

      <TabsContent value="workflow" className="mt-6">
        <CreateCourseWorkflow onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="copy" className="mt-6">
        <CopyCourseForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};
