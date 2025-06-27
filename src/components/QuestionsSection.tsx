
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Building, User, Clock, Tag } from "lucide-react";
import { InterviewQuestion } from "@/services/questionsService";

interface QuestionsSectionProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
}

export const QuestionsSection = ({ questions, loading, error }: QuestionsSectionProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Interview Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <MessageSquare className="w-5 h-5" />
            Interview Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Interview Questions ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No questions available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
                  {question.additional_context && (
                    <p className="text-gray-600 text-sm mb-3">{question.additional_context}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {question.company}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {question.role}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {question.category}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {question.interview_stage}
                  </Badge>
                  {question.difficulty && (
                    <Badge 
                      variant={
                        question.difficulty === 'Easy' ? 'default' : 
                        question.difficulty === 'Medium' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {question.difficulty}
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <span>
                    Submitted by: {question.submitted_by || 'Anonymous'}
                  </span>
                  <span>
                    {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
