
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface StageInformationProps {
  information: string | null;
}

export const StageInformation = ({ information }: StageInformationProps) => {
  if (!information) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No information available for this stage.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Stage Information</h3>
      <RichTextDisplay content={information} />
    </div>
  );
};
