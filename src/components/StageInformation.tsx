
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface StageInformationProps {
  information: string | null;
}

export const StageInformation = ({ information }: StageInformationProps) => {
  if (!information) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No information available for this stage.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Stage Information</h3>
      <RichTextDisplay content={information} />
    </div>
  );
};
