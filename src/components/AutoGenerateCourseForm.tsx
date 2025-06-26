
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Check, X, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

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

const wovenStages = [
  {
    title: "HR Screening",
    description: "This initial screening focuses on cultural fit, communication skills, and basic qualifications. Expect questions about your background, motivation for joining Woven by Toyota, understanding of our mobility vision, and general behavioral questions. Prepare by researching Toyota's values, Woven's mission in mobility technology, and be ready to discuss your career goals and how they align with our company culture. This stage typically lasts 30-45 minutes and sets the foundation for the technical rounds.",
    stage_order: 1
  },
  {
    title: "Technical Assignment",
    description: "A take-home coding challenge that reflects real-world problems you'd solve at Woven by Toyota. This assignment tests your ability to write clean, maintainable code, follow best practices, and solve complex technical problems independently. You'll typically have 2-3 days to complete it. Focus on code quality, documentation, testing, and architectural decisions. The assignment often involves data processing, API integration, or system design relevant to mobility and automotive technology.",
    stage_order: 2
  },
  {
    title: "Technical Assessment/Cross-Functional",
    description: "This comprehensive interview combines technical deep-dive discussions with cross-functional collaboration scenarios. You'll review your technical assignment with engineers, discuss architectural decisions, and demonstrate problem-solving skills through coding exercises. The cross-functional aspect involves collaboration scenarios with product managers, designers, and other stakeholders. Prepare to explain your technical choices, discuss trade-offs, handle code reviews, and demonstrate how you work in interdisciplinary teams typical of automotive technology development.",
    stage_order: 3
  },
  {
    title: "Final Interview",
    description: "The final round focuses on leadership potential, strategic thinking, and long-term fit with Woven by Toyota's vision. Expect discussions about your career aspirations, how you handle challenges, your approach to innovation in mobility technology, and your understanding of the automotive industry's future. This stage often involves senior leadership and covers topics like mentoring, project leadership, and your potential contributions to Woven's mission of creating safer, more sustainable mobility solutions.",
    stage_order: 4
  }
];

export const AutoGenerateCourseForm = ({ onSuccess }: AutoGenerateCourseFormProps) => {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all approved questions for preview
  const { data: allQuestions } = useQuery({
    queryKey: ['all-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('status', 'approved');
      
      if (error) throw error;
      return data;
    },
  });

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
      console.log('Starting course generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-course-from-job-description', {
        body: { 
          jobDescription,
          jobTitle: jobTitle.trim(),
          company: company.trim()
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Unknown error occurred');
      }

      if (data?.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }

      if (!data) {
        throw new Error('No data received from the AI service');
      }

      // If company is Woven by Toyota, use predefined stages
      if (company.toLowerCase().includes('woven') && company.toLowerCase().includes('toyota')) {
        data.stages = wovenStages.map(stage => ({
          ...stage,
          recommendedQuestionIds: []
        }));
      }

      setGeneratedCourse(data);
      toast({
        title: "Course Generated!",
        description: "Review the generated course and create it if it looks good.",
      });
    } catch (error) {
      console.error('Error generating course:', error);
      
      let errorMessage = "Failed to generate course. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = "OpenAI rate limit exceeded. Please wait a moment before trying again.";
        } else if (error.message.includes('API key')) {
          errorMessage = "OpenAI API key issue. Please check your API key configuration.";
        } else if (error.message.includes('quota') || error.message.includes('billing')) {
          errorMessage = "OpenAI quota exceeded. Please check your billing and usage limits.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
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
            information: stage.description, // Use description as information for now
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
      setGeneratedCourse(null);
      setJobTitle("");
      setCompany("");
      setJobDescription("");
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

  const updateCourseField = (field: keyof GeneratedCourse, value: any) => {
    if (!generatedCourse) return;
    setGeneratedCourse({ ...generatedCourse, [field]: value });
  };

  const updateStage = (index: number, field: string, value: any) => {
    if (!generatedCourse) return;
    const updatedStages = [...generatedCourse.stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setGeneratedCourse({ ...generatedCourse, stages: updatedStages });
  };

  const getQuestionsForStage = (questionIds: string[]) => {
    if (!allQuestions) return [];
    return allQuestions.filter(q => questionIds.includes(q.id));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title
              </label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Company
              </label>
              <Input
                placeholder="e.g., Woven by Toyota"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          
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
            <div className="flex justify-between items-center">
              <CardTitle>Generated Course {isEditing ? "(Editing)" : "(Preview)"}</CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Preview Mode" : "Edit Mode"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="course-title">Course Title</Label>
                    <Input
                      id="course-title"
                      value={generatedCourse.courseTitle}
                      onChange={(e) => updateCourseField('courseTitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-description">Course Description</Label>
                    <Textarea
                      id="course-description"
                      value={generatedCourse.courseDescription}
                      onChange={(e) => updateCourseField('courseDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Interview Stages</h4>
                  <div className="space-y-4">
                    {generatedCourse.stages.map((stage, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`stage-title-${index}`}>Stage Title</Label>
                            <Input
                              id={`stage-title-${index}`}
                              value={stage.title}
                              onChange={(e) => updateStage(index, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`stage-description-${index}`}>Stage Description</Label>
                            <Textarea
                              id={`stage-description-${index}`}
                              value={stage.description}
                              onChange={(e) => updateStage(index, 'description', e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-lg mb-2">{stage.title}</h5>
                            <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Badge variant="outline">{stage.recommendedQuestionIds.length} questions</Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>{stage.title} - Preview</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] pr-4">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Stage Description</h4>
                                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                        {stage.description}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Recommended Questions ({stage.recommendedQuestionIds.length})</h4>
                                      {stage.recommendedQuestionIds.length > 0 ? (
                                        <div className="space-y-3">
                                          {getQuestionsForStage(stage.recommendedQuestionIds).map((question, qIndex) => (
                                            <div key={qIndex} className="border rounded-lg p-3 bg-white">
                                              <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium">{question.question}</h5>
                                                <div className="flex gap-1">
                                                  <Badge variant="secondary" className="text-xs">{question.category}</Badge>
                                                  <Badge variant="outline" className="text-xs">{question.difficulty}</Badge>
                                                </div>
                                              </div>
                                              <div className="text-xs text-gray-500 flex gap-4">
                                                <span>Company: {question.company}</span>
                                                <span>Role: {question.role}</span>
                                                <span>Stage: {question.interview_stage}</span>
                                              </div>
                                              {question.additional_context && (
                                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                                  {question.additional_context}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">No questions selected for this stage.</p>
                                      )}
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
