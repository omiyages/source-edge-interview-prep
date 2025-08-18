
// ABOUTME: Enhanced input validation utility with security checks
// ABOUTME: Provides comprehensive validation and sanitization for user inputs

import { logInvalidInput, logXSSAttempt } from "./securityLogger";

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
}

export const validateAndSanitizeEmail = (email: string, userId?: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Check for XSS attempts
  if (/<script|javascript:|on\w+=/i.test(email)) {
    logXSSAttempt(`XSS attempt in email field: ${email}`, userId);
    errors.push('Invalid email format');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitizedEmail = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitizedEmail)) {
    logInvalidInput(`Invalid email format: ${email}`, userId);
    errors.push('Please enter a valid email address');
    return { isValid: false, errors };
  }

  if (sanitizedEmail.length > 254) {
    errors.push('Email address is too long');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitizedValue: sanitizedEmail,
    errors: []
  };
};

export const validateAndSanitizeName = (name: string, userId?: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  // Check for XSS attempts
  if (/<script|javascript:|on\w+=/i.test(name)) {
    logXSSAttempt(`XSS attempt in name field: ${name}`, userId);
    errors.push('Invalid name format');
    return { isValid: false, errors };
  }

  // Remove dangerous characters and excessive whitespace
  const sanitizedName = name
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (sanitizedName.length === 0) {
    errors.push('Name cannot be empty');
    return { isValid: false, errors };
  }

  if (sanitizedName.length > 100) {
    errors.push('Name is too long (maximum 100 characters)');
    return { isValid: false, errors };
  }

  // Check for suspicious patterns
  if (/[{}[\]\\]/.test(sanitizedName)) {
    logInvalidInput(`Suspicious characters in name: ${name}`, userId);
    errors.push('Name contains invalid characters');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitizedValue: sanitizedName,
    errors: []
  };
};

export const validateAndSanitizeReason = (reason: string, userId?: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!reason || typeof reason !== 'string') {
    return {
      isValid: true,
      sanitizedValue: '',
      errors: []
    };
  }

  // Check for XSS attempts
  if (/<script|javascript:|on\w+=/i.test(reason)) {
    logXSSAttempt(`XSS attempt in reason field: ${reason}`, userId);
    errors.push('Invalid reason format');
    return { isValid: false, errors };
  }

  const sanitizedReason = reason
    .replace(/[<>]/g, '')
    .trim();

  if (sanitizedReason.length > 500) {
    errors.push('Reason is too long (maximum 500 characters)');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitizedValue: sanitizedReason,
    errors: []
  };
};

export const validateRole = (role: string): ValidationResult => {
  const validRoles = ['user', 'admin'];
  
  if (!validRoles.includes(role)) {
    return {
      isValid: false,
      errors: ['Invalid role specified']
    };
  }

  return {
    isValid: true,
    sanitizedValue: role,
    errors: []
  };
};
