
// ABOUTME: Enhanced input validation utilities with XSS protection
// ABOUTME: Provides comprehensive validation for all user inputs with security focus

import DOMPurify from 'dompurify';
import { logInvalidInput, logXSSAttempt } from './securityLogger';

interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateAndSanitizeInput = (
  input: string, 
  maxLength: number = 10000,
  userId?: string
): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Input is required and must be a string');
    return { isValid: false, sanitizedValue: '', errors };
  }

  // Check for XSS attempts
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /data:text\/html/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      logXSSAttempt(`XSS attempt detected in input: ${input.substring(0, 100)}`, userId);
      errors.push('Invalid characters detected in input');
      return { isValid: false, sanitizedValue: '', errors };
    }
  }

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();

  if (sanitized.length === 0) {
    errors.push('Input cannot be empty after sanitization');
    return { isValid: false, sanitizedValue: '', errors };
  }

  if (sanitized.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    return { isValid: false, sanitizedValue: sanitized.substring(0, maxLength), errors };
  }

  return { 
    isValid: true, 
    sanitizedValue: sanitized, 
    errors: [] 
  };
};

export const validateRole = (role: string): ValidationResult => {
  const validRoles = ['user', 'admin'];
  
  if (!validRoles.includes(role)) {
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Invalid role specified']
    };
  }

  return {
    isValid: true,
    sanitizedValue: role,
    errors: []
  };
};

export const validateAndSanitizeReason = (
  reason: string,
  userId?: string
): ValidationResult => {
  const validation = validateAndSanitizeInput(reason, 500, userId);
  
  if (validation.isValid && validation.sanitizedValue.length < 10) {
    return {
      isValid: false,
      sanitizedValue: validation.sanitizedValue,
      errors: ['Reason must be at least 10 characters long']
    };
  }

  return validation;
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();
};
