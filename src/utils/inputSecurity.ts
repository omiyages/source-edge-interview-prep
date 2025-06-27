
// Input validation and sanitization utilities for security

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateQuestionInput = (question: string): ValidationResult => {
  if (!question || question.trim().length === 0) {
    return { isValid: false, message: "Question cannot be empty" };
  }
  
  if (question.length > 2000) {
    return { isValid: false, message: "Question cannot exceed 2000 characters" };
  }
  
  // Check for potentially malicious patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(question)) {
      return { isValid: false, message: "Invalid characters detected in question" };
    }
  }
  
  return { isValid: true };
};

export const validateCompanyInput = (company: string): ValidationResult => {
  if (!company || company.trim().length === 0) {
    return { isValid: false, message: "Company name cannot be empty" };
  }
  
  if (company.length > 100) {
    return { isValid: false, message: "Company name cannot exceed 100 characters" };
  }
  
  return { isValid: true };
};

export const validateRoleInput = (role: string): ValidationResult => {
  if (!role || role.trim().length === 0) {
    return { isValid: false, message: "Role cannot be empty" };
  }
  
  if (role.length > 100) {
    return { isValid: false, message: "Role cannot exceed 100 characters" };
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

// Rate limiting utility
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};
