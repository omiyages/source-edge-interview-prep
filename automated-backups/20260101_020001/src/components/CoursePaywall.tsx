import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";

interface CoursePaywallProps {
  courseTitle: string;
  companyName: string | null;
  stagesCount: number;
  questionsCount: number;
  onStartCourse: () => void;
  isStarting?: boolean;
}

export const CoursePaywall = ({
  courseTitle,
  companyName,
  stagesCount,
  questionsCount,
  onStartCourse,
  isStarting = false,
}: CoursePaywallProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-300px)] py-12">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-lg p-8 text-center">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Start?
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Unlock the full course content, including {stagesCount} interview stage{stagesCount !== 1 ? 's' : ''}, {questionsCount} practice question{questionsCount !== 1 ? 's' : ''}, and curated learning resources designed specifically for {companyName || 'this company'}.
          </p>

          {/* Start Course Button */}
          <Button
            onClick={onStartCourse}
            disabled={isStarting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-6"
            size="lg"
          >
            {isStarting ? 'Starting...' : 'Start Course →'}
          </Button>

          {/* Features List */}
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-600" />
              <span>{stagesCount} Stage{stagesCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-600" />
              <span>{questionsCount} Question{questionsCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-600" />
              <span>Free Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

