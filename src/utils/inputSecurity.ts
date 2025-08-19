
// ABOUTME: Core input security utilities for validation and sanitization
// ABOUTME: Provides foundational security functions used across the application

import DOMPurify from 'dompurify';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();
};

export const validateInputLength = (input: string, maxLength: number = 1000): boolean => {
  return input && input.length <= maxLength;
};

export const detectXSSAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /data:text\/html/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};
