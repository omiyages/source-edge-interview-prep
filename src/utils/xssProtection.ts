
// ABOUTME: XSS protection utilities for sanitizing HTML content and user inputs
// ABOUTME: Provides comprehensive protection against cross-site scripting attacks

import DOMPurify from 'dompurify';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}

export const sanitizeHtml = (html: string, options: SanitizeOptions = {}): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const defaultConfig = {
    ALLOWED_TAGS: options.allowedTags || ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote'],
    ALLOWED_ATTR: options.allowedAttributes || ['class'],
    KEEP_CONTENT: !options.stripTags,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  };

  try {
    return DOMPurify.sanitize(html, defaultConfig);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return '';
  }
};

export const sanitizeForDisplay = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'h1', 'h2', 'h3'],
    allowedAttributes: ['class'],
  });
};

export const stripAllHtml = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: [],
    stripTags: true,
  });
};

export const validateAndSanitizeInput = (input: string, maxLength: number = 1000): { isValid: boolean; sanitized: string; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    errors.push('Input is required');
    return { isValid: false, sanitized: '', errors };
  }

  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
  }

  // Check for potential XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  ];

  const hasXSS = xssPatterns.some(pattern => pattern.test(input));
  if (hasXSS) {
    errors.push('Input contains potentially malicious content');
  }

  const sanitized = stripAllHtml(input).trim();
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};
