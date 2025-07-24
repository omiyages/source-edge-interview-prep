
// Input validation and sanitization utilities for security
import { logInvalidInput, logXSSAttempt } from './securityLogger';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Enhanced XSS detection patterns
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<img[^>]+onerror/gi,
  /<svg[^>]*on\w+/gi,
];

const detectXSS = (input: string, userId?: string): boolean => {
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      logXSSAttempt(`XSS attempt detected: ${pattern.source}`, userId, {
        input: input.substring(0, 100), // Log first 100 chars
        pattern: pattern.source
      });
      return true;
    }
  }
  return false;
};

export const validateQuestionInput = (question: string, userId?: string): ValidationResult => {
  if (!question || question.trim().length === 0) {
    return { isValid: false, message: "Question cannot be empty" };
  }
  
  if (question.length > 2000) {
    logInvalidInput(`Question exceeds length limit: ${question.length} chars`, userId);
    return { isValid: false, message: "Question cannot exceed 2000 characters" };
  }
  
  // Check for XSS attempts
  if (detectXSS(question, userId)) {
    return { isValid: false, message: "Invalid content detected in question" };
  }
  
  return { isValid: true };
};

export const validateCompanyInput = (company: string, userId?: string): ValidationResult => {
  if (!company || company.trim().length === 0) {
    return { isValid: false, message: "Company name cannot be empty" };
  }
  
  if (company.length > 100) {
    logInvalidInput(`Company name exceeds length limit: ${company.length} chars`, userId);
    return { isValid: false, message: "Company name cannot exceed 100 characters" };
  }
  
  if (detectXSS(company, userId)) {
    return { isValid: false, message: "Invalid content detected in company name" };
  }
  
  return { isValid: true };
};

export const validateRoleInput = (role: string, userId?: string): ValidationResult => {
  if (!role || role.trim().length === 0) {
    return { isValid: false, message: "Role cannot be empty" };
  }
  
  if (role.length > 100) {
    logInvalidInput(`Role exceeds length limit: ${role.length} chars`, userId);
    return { isValid: false, message: "Role cannot exceed 100 characters" };
  }
  
  if (detectXSS(role, userId)) {
    return { isValid: false, message: "Invalid content detected in role" };
  }
  
  return { isValid: true };
};

export const sanitizeTextInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .trim()
    .substring(0, 2000); // Limit length
};

export const sanitizeUrlInput = (url: string): string => {
  try {
    const cleanUrl = url.trim();
    
    // Basic URL validation
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return '';
    }
    
    // Create URL object to validate
    new URL(cleanUrl);
    
    return cleanUrl.substring(0, 500); // Limit length
  } catch {
    return '';
  }
};

// Enhanced rate limiting utility with security logging
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000, userId?: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    logInvalidInput(`Rate limit exceeded for key: ${key}`, userId, {
      attempts: record.count,
      maxRequests,
      windowMs
    });
    return false;
  }
  
  record.count++;
  return true;
};

// Content Security Policy helper
export const getCSPDirectives = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};
