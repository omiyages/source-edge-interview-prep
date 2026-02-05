import { Progress } from "@/components/ui/progress";

interface CourseProgressProps {
  userProgress?: Array<{ stage_id: string }>;
  stages?: Array<{ id: string }>;
  isAdmin: boolean;
}

export const CourseProgress = ({ userProgress, stages, isAdmin }: CourseProgressProps) => {
  if (isAdmin || !stages?.length) return null;

  const getProgressPercentage = () => {
    if (!stages?.length || !userProgress?.length) return 0;
    return Math.round((userProgress.length / stages.length) * 100);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Course Progress</h3>
        <span className="text-sm text-gray-600">{getProgressPercentage()}% Complete</span>
      </div>
      <Progress value={getProgressPercentage()} className="h-3" />
      <p className="text-sm text-gray-600 mt-1">
        {userProgress?.length || 0} of {stages.length} stages completed
      </p>
    </div>
  );
};