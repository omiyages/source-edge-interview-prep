
// ABOUTME: Secure rich text display component with XSS protection
// ABOUTME: Replaces unsafe dangerouslySetInnerHTML with proper sanitization

import React from 'react';
import { sanitizeForDisplay } from '@/utils/xssProtection';

interface SecureRichTextDisplayProps {
  content: string;
  className?: string;
}

export const SecureRichTextDisplay: React.FC<SecureRichTextDisplayProps> = ({ 
  content, 
  className = '' 
}) => {
  if (!content) {
    return <div className={className}>No content available</div>;
  }

  const sanitizedContent = sanitizeForDisplay(content);
  
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
