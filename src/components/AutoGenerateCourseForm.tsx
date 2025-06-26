
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GeneratedCourse {
  courseTitle: string;
  courseDescription: string;
  stages: Array<{
    title: string;
    description: string;
    stage_order: number;
    recommendedQuestionIds: string[];
  }>;
  keySkills: string[];
  roleLevel: string;
  primaryRole: string;
}

interface AutoGenerateCourseFormProps {
  onSuccess: () => void;
}

export const AutoGenerateCourseForm = ({ onSuccess }: AutoGenerateCourseFormProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-from-job-description', {
        body: { jobDescription }
      });

      if (error) throw error;

      setGeneratedCourse(data);
      toast({
        title: "Course Generated!",
        description: "Review the generated course and create it if it looks good.",
      });
    } catch (error) {
      console.error('Error generating course:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedCourse || !user) return;

    setIsCreating(true);
    try {
      // Create the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: generatedCourse.courseTitle,
          description: generatedCourse.courseDescription,
          created_by: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create stages and associate questions
      for (const stage of generatedCourse.stages) {
        const { data: createdStage, error: stageError } = await supabase
          .from('course_stages')
          .insert({
            course_id: course.id,
            title: stage.title,
            description: stage.description,
            stage_order: stage.stage_order,
          })
          .select()
          .single();

        if (stageError) throw stageError;

        // Associate questions with this stage
        if (stage.recommendedQuestionIds.length > 0) {
          const stageQuestions = stage.recommendedQuestionIds.map(questionId => ({
            stage_id: createdStage.id,
            question_id: questionId,
          }));

          const { error: questionsError } = await supabase
            .from('stage_questions')
            .insert(stageQuestions);

          if (questionsError) throw questionsError;
        }
      }

      toast({
        title: "Course Created!",
        description: "The AI-generated course has been successfully created.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Course Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description
            </label>
            <Textarea
              placeholder="Paste the job description here. The AI will analyze it and generate a relevant interview course with appropriate questions..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Job Description...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Course with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Course Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{generatedCourse.courseTitle}</h3>
              <p className="text-gray-600 mt-1">{generatedCourse.courseDescription}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Role: {generatedCourse.primaryRole}</Badge>
              <Badge variant="outline">Level: {generatedCourse.roleLevel}</Badge>
              {generatedCourse.keySkills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-3">Interview Stages ({generatedCourse.stages.length})</h4>
              <div className="space-y-3">
                {generatedCourse.stages.map((stage, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{stage.title}</h5>
                      <Badge variant="outline">{stage.recommendedQuestionIds.length} questions</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{stage.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateCourse}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create This Course
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedCourse(null)}
                disabled={isCreating}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
