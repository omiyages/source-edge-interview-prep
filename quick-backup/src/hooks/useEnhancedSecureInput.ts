// ABOUTME: Enhanced secure input hook combining XSS protection, validation, and rate limiting
// ABOUTME: Provides comprehensive security for all user input forms

import { useState, useCallback } from 'react';
import { useSecureInput } from './useSecureInput';
import { useRateLimit } from './useRateLimit';
import { useToast } from './use-toast';

interface EnhancedSecureInputConfig {
  maxLength?: number;
  required?: boolean;
  allowHtml?: boolean;
  rateLimitOperation?: string;
  rateLimitMaxAttempts?: number;
  rateLimitWindowMinutes?: number;
}

export const useEnhancedSecureInput = (
  initialValue: string = '', 
  config: EnhancedSecureInputConfig = {}
) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  
  const secureInput = useSecureInput(initialValue, {
    maxLength: config.maxLength,
    required: config.required,
    allowHtml: config.allowHtml,
  });

  const secureSetValue = useCallback(async (input: string) => {
    // Check rate limiting for sensitive operations
    if (config.rateLimitOperation) {
      const canProceed = await checkRateLimit({
        operation: config.rateLimitOperation,
        maxAttempts: config.rateLimitMaxAttempts || 10,
        windowMinutes: config.rateLimitWindowMinutes || 5,
      });

      if (!canProceed) {
        setIsBlocked(true);
        return;
      }
    }

    setIsBlocked(false);
    secureInput.setValue(input);
  }, [checkRateLimit, config, secureInput.setValue]);

  const validateAndSubmit = useCallback(async (submitFn: () => Promise<void>) => {
    if (isBlocked) {
      toast({
        title: "Rate Limited",
        description: "Please wait before submitting again.",
        variant: "destructive",
      });
      return false;
    }

    if (!secureInput.isValid) {
      toast({
        title: "Validation Error",
        description: secureInput.errors.join(', '),
        variant: "destructive",
      });
      return false;
    }

    try {
      await submitFn();
      return true;
    } catch (error) {
      console.error('Submit error:', error);
      return false;
    }
  }, [isBlocked, secureInput.isValid, secureInput.errors, toast]);

  return {
    ...secureInput,
    setValue: secureSetValue,
    validateAndSubmit,
    isBlocked,
  };
};