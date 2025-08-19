
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

export const sanitizeTextInput = (input: string): string => {
  return sanitizeInput(input);
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

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateQuestionInput = (question: string): ValidationResult => {
  if (!question || typeof question !== 'string') {
    return { isValid: false, message: 'Question is required' };
  }

  if (question.trim().length < 10) {
    return { isValid: false, message: 'Question must be at least 10 characters long' };
  }

  if (question.length > 2000) {
    return { isValid: false, message: 'Question exceeds maximum length of 2000 characters' };
  }

  if (detectXSSAttempt(question)) {
    return { isValid: false, message: 'Invalid characters detected in question' };
  }

  return { isValid: true };
};

export const validateCompanyInput = (company: string): ValidationResult => {
  if (!company || typeof company !== 'string') {
    return { isValid: false, message: 'Company is required' };
  }

  const validCompanies = ['Woven by Toyota', 'LexxPluss', 'Wismettac'];
  if (!validCompanies.includes(company)) {
    return { isValid: false, message: 'Please select a valid company' };
  }

  return { isValid: true };
};

export const validateRoleInput = (role: string): ValidationResult => {
  if (!role || typeof role !== 'string') {
    return { isValid: false, message: 'Role is required' };
  }

  const validRoles = [
    'Backend Engineer',
    'Frontend Engineer', 
    'Full Stack Engineer',
    'SRE/DevOps',
    'Engineering Manager',
    'Product Manager',
    'Data Engineer'
  ];
  
  if (!validRoles.includes(role)) {
    return { isValid: false, message: 'Please select a valid role' };
  }

  return { isValid: true };
};

// Simple rate limiting using localStorage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  rateLimitStore.set(key, existing);
  return true;
};
