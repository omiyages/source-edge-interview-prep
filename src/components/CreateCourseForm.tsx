
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Wand2 } from "lucide-react";
import { AutoGenerateCourseForm } from "./AutoGenerateCourseForm";

interface CreateCourseFormData {
  title: string;
  description: string;
}

interface CreateCourseFormProps {
  onSuccess: () => void;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<CreateCourseFormData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleSubmit = async (data: CreateCourseFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Course Created",
        description: "Your course has been created successfully.",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Manual Creation
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Generation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Course title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter course description" 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="ai" className="mt-6">
        <AutoGenerateCourseForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};
