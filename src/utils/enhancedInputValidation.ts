
// ABOUTME: Enhanced input validation with comprehensive security checks
// ABOUTME: Replaces basic validation with enterprise-grade security validation

import { validateAndSanitizeInput } from '@/utils/xssProtection';
import { logInvalidInput, logSuspiciousActivity } from '@/utils/securityLogger';

interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

export const validateSecureTextInput = (
  input: string,
  fieldName: string,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    allowSpecialChars?: boolean;
    userId?: string;
  } = {}
): ValidationResult => {
  const {
    minLength = 1,
    maxLength = 1000,
    required = true,
    allowSpecialChars = true,
    userId
  } = options;

  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { isValid: false, sanitizedValue: '', errors };
  }

  // Basic length validation
  if (input.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters long`);
  }

  if (input.length > maxLength) {
    errors.push(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }

  // Advanced security validation
  const result = validateAndSanitizeInput(input, maxLength);
  
  if (!result.isValid) {
    errors.push(...result.errors);
    
    // Log security violations
    logInvalidInput(
      `Invalid input detected in ${fieldName}: ${result.errors.join(', ')}`,
      userId,
      { fieldName, originalInput: input.slice(0, 100) }
    );
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(?:union|select|insert|delete|drop|create|alter)\s+/gi, // SQL injection attempts
    /(?:eval|function|constructor|prototype)/gi, // JavaScript injection
    /(?:<script|javascript:|vbscript:|onload|onerror)/gi, // XSS attempts
    /(?:\.\.|\/etc\/|\/var\/|\/usr\/)/gi, // Path traversal
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(input));
  if (hasSuspiciousContent) {
    errors.push(`${fieldName} contains suspicious content`);
    
    logSuspiciousActivity(
      `Suspicious input pattern detected in ${fieldName}`,
      userId,
      { fieldName, suspiciousInput: input.slice(0, 100) }
    );
  }

  // Special character validation
  if (!allowSpecialChars) {
    const hasSpecialChars = /[<>&"'`]/g.test(input);
    if (hasSpecialChars) {
      errors.push(`${fieldName} contains invalid characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: result.sanitized,
    errors
  };
};

export const validateEmailInput = (email: string, userId?: string): ValidationResult => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  if (!email || !emailRegex.test(email)) {
    logInvalidInput('Invalid email format', userId, { email: email?.slice(0, 20) });
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Please enter a valid email address']
    };
  }

  // Check for suspicious email patterns
  const suspiciousPatterns = [
    /(?:admin|root|system|noreply)@/gi,
    /(?:test|temp|fake|dummy).*@/gi,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));
  if (isSuspicious) {
    logSuspiciousActivity('Suspicious email pattern detected', userId, { email });
  }

  return {
    isValid: true,
    sanitizedValue: email.toLowerCase().trim(),
    errors: []
  };
};

export const validateUrlInput = (url: string, userId?: string): ValidationResult => {
  try {
    const urlObj = new URL(url);
    
    // Allow only HTTPS URLs for security
    if (urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Only HTTPS URLs are allowed']
      };
    }

    // Blacklist suspicious domains
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
      'localhost', '127.0.0.1', '0.0.0.0', // Local addresses
    ];

    const isSuspiciousDomain = suspiciousDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );

    if (isSuspiciousDomain) {
      logSuspiciousActivity('Suspicious URL domain detected', userId, { url });
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['This URL domain is not allowed']
      };
    }

    return {
      isValid: true,
      sanitizedValue: urlObj.toString(),
      errors: []
    };
  } catch (error) {
    logInvalidInput('Invalid URL format', userId, { url: url?.slice(0, 50) });
    return {
      isValid: false,
      sanitizedValue: '',
      errors: ['Please enter a valid URL']
    };
  }
};
