
import React from 'react';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay = ({ content, className }: RichTextDisplayProps) => {
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none text-gray-700 leading-relaxed",
        "[&_p]:font-normal [&_p]:text-gray-700 [&_p]:mb-2 [&_p]:text-base", // Ensure 16px minimum
        "[&_li]:font-normal [&_li]:text-gray-700 [&_li]:text-base", // Ensure 16px minimum
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_h1]:font-semibold [&_h1]:text-gray-900",
        "[&_h2]:font-semibold [&_h2]:text-gray-900",
        "[&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_span]:text-base", // Ensure 16px minimum for spans
        "[&_div]:text-base", // Ensure 16px minimum for divs
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
