import React from "react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface StageInformationProps {
  information: string | null;
  stageTitle?: string;
  children?: React.ReactNode;
}

export const StageInformation = ({ information, stageTitle, children }: StageInformationProps) => {
  if (!information) {
    return (
      <div className="bg-white rounded-lg border border-border p-6 shadow-sm h-full">
      <div className="text-center py-8 text-muted-foreground">
        <p>No information available for this stage.</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Stage Information: {stageTitle || 'Stage'}
      </h3>
      <div className="flex-1">
      <RichTextDisplay content={information} />
      </div>
      {children && (
        <div className="mt-6 pt-6 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
};
