
import React from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay = ({ content, className }: RichTextDisplayProps) => {
  // Sanitize the content before rendering
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none text-foreground leading-relaxed",
        "[&_p]:font-normal [&_p]:text-foreground [&_p]:mb-2 [&_p]:text-sm",
        "[&_li]:font-normal [&_li]:text-foreground [&_li]:text-sm",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:text-lg [&_h1]:mb-3 [&_h1]:mt-4",
        "[&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-base [&_h2]:mb-2 [&_h2]:mt-3",
        "[&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:mb-2 [&_h3]:mt-3",
        "[&_span]:text-sm",
        "[&_div]:text-sm",
        "[&_td]:text-sm [&_th]:text-sm",
        "[&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:border [&_code]:border-border [&_code]:text-foreground",
        "[&_pre]:text-xs [&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:my-4 [&_pre]:border [&_pre]:border-border [&_pre]:shadow-sm [&_pre]:block [&_pre]:whitespace-pre-wrap",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground [&_pre_code]:border-0 [&_pre_code]:font-mono",
        "[&_kbd]:text-xs [&_kbd]:bg-muted [&_kbd]:px-1 [&_kbd]:py-0.5 [&_kbd]:rounded [&_kbd]:font-mono [&_kbd]:border [&_kbd]:border-border",
        "[&_samp]:text-xs [&_samp]:bg-muted [&_samp]:px-1 [&_samp]:py-0.5 [&_samp]:rounded [&_samp]:font-mono [&_samp]:border [&_samp]:border-border",
        "[&_var]:text-xs [&_var]:bg-muted [&_var]:px-1 [&_var]:py-0.5 [&_var]:rounded [&_var]:font-mono [&_var]:border [&_var]:border-border [&_var]:italic",
        "[&_blockquote]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
