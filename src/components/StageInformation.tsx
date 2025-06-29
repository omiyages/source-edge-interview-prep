
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface StageInformationProps {
  selectedStage: CourseStage;
}

export const StageInformation = ({ selectedStage }: StageInformationProps) => {
  // Function to format text with markdown-like bold syntax
  const formatText = (text: string) => {
    if (!text) return text;
    
    // Split by ** to find bold sections
    const parts = text.split('**');
    return parts.map((part, index) => {
      // Every odd index should be bold
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      // Convert line breaks to <br> tags for regular text
      return part.split('\n').map((line, lineIndex, lines) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge>{selectedStage.stage_order}</Badge>
          {selectedStage.title}
        </CardTitle>
        {selectedStage.description && (
          <p className="text-gray-600 mt-2">{selectedStage.description}</p>
        )}
      </CardHeader>
      {selectedStage.information && (
        <CardContent>
          <div className="prose prose-blue max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {formatText(selectedStage.information)}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
