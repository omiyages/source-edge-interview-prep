
import DOMPurify from 'dompurify';
import { logXSSAttempt, logInvalidInput } from './securityLogger';

// Enhanced input validation and sanitization
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email) && email.length <= 254;
  
  if (!isValid) {
    logInvalidInput(`Invalid email format: ${email.substring(0, 20)}...`, undefined, {
      email: email.substring(0, 50),
      length: email.length
    });
  }
  
  return isValid;
};

export const sanitizeInput = (input: string): string => {
  // Check for potential XSS attempts
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  const hasXSS = xssPatterns.some(pattern => pattern.test(input));
  
  if (hasXSS) {
    logXSSAttempt(`XSS attempt detected in input: ${input.substring(0, 100)}...`, undefined, {
      input: input.substring(0, 200),
      detectedPatterns: xssPatterns.filter(pattern => pattern.test(input)).map(p => p.toString())
    });
  }
  
  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  return sanitized.trim().substring(0, 1000);
};

export const validateAndSanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  if (input.length > maxLength) {
    logInvalidInput(`Input too long: ${input.length} characters (max: ${maxLength})`);
    return sanitizeInput(input.substring(0, maxLength));
  }
  
  return sanitizeInput(input);
};

// Password strength validation
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { isValid: false, message: "Password contains common weak patterns" };
  }
  
  return { isValid: true };
};

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const checkRateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const key = identifier.toLowerCase();
  const attempt = authAttempts.get(key) || { count: 0, lastAttempt: 0 };
  
  // Reset counter if window has passed
  if (now - attempt.lastAttempt > windowMs) {
    attempt.count = 0;
  }
  
  if (attempt.count >= maxAttempts) {
    logInvalidInput(`Rate limit exceeded for: ${identifier}`, undefined, {
      identifier,
      attemptCount: attempt.count,
      windowMs
    });
    return false;
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  authAttempts.set(key, attempt);
  
  return true;
};
