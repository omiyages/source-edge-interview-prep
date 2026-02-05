
// ABOUTME: Secure input validation hook with real-time XSS protection
// ABOUTME: Provides comprehensive input validation and sanitization

import { useState, useCallback } from 'react';
import { validateAndSanitizeInput } from '@/utils/xssProtection';
import { useToast } from '@/hooks/use-toast';

interface SecureInputConfig {
  maxLength?: number;
  required?: boolean;
  allowHtml?: boolean;
}

export const useSecureInput = (initialValue: string = '', config: SecureInputConfig = {}) => {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const { toast } = useToast();

  const validateAndSet = useCallback((input: string) => {
    const result = validateAndSanitizeInput(input, config.maxLength);
    
    if (!result.isValid) {
      setErrors(result.errors);
      setIsValid(false);
      
      // Show toast for security violations
      if (result.errors.some(error => error.includes('malicious'))) {
        toast({
          title: "Security Warning",
          description: "Potentially malicious content detected and blocked.",
          variant: "destructive",
        });
      }
    } else {
      setErrors([]);
      setIsValid(true);
    }

    setValue(config.allowHtml ? input : result.sanitized);
  }, [config.maxLength, config.allowHtml, toast]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setErrors([]);
    setIsValid(true);
  }, [initialValue]);

  return {
    value,
    setValue: validateAndSet,
    errors,
    isValid,
    reset,
  };
};
