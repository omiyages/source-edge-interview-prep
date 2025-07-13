
import React from 'react';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay = ({ content, className }: RichTextDisplayProps) => {
  return (
    <div 
      className={cn("prose prose-sm max-w-none [&_p]:font-normal [&_li]:font-normal [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-6 [&_ol]:ml-6", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
