
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
        "[&_p]:font-normal [&_p]:text-gray-700 [&_p]:mb-2 [&_p]:text-sm", // 14px minimum
        "[&_li]:font-normal [&_li]:text-gray-700 [&_li]:text-sm", // 14px minimum
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_h1]:font-semibold [&_h1]:text-gray-900 [&_h1]:text-lg",
        "[&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:text-base",
        "[&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:text-sm",
        "[&_span]:text-sm", // 14px minimum for spans
        "[&_div]:text-sm", // 14px minimum for divs
        "[&_td]:text-sm [&_th]:text-sm", // 14px minimum for table cells
        "[&_code]:text-sm", // 14px minimum for code
        "[&_pre]:text-sm", // 14px minimum for preformatted text
        "[&_blockquote]:text-sm", // 14px minimum for blockquotes
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
