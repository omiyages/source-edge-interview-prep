// ABOUTME: Enhanced security monitoring hook with comprehensive logging
// ABOUTME: Provides granular security event tracking and threat detection

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type SecurityEventType = 
  | 'auth_failure' 
  | 'rate_limit_exceeded' 
  | 'suspicious_activity' 
  | 'admin_action' 
  | 'data_access_violation' 
  | 'xss_attempt'
  | 'csrf_attempt';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface SecurityEventParams {
  eventType: SecurityEventType;
  resourceAccessed?: string;
  actionAttempted?: string;
  success?: boolean;
  riskLevel?: RiskLevel;
  metadata?: Record<string, any>;
}

export const useEnhancedSecurityMonitor = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (params: SecurityEventParams) => {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: params.eventType,
        p_user_id: user?.id || null,
        p_user_email: user?.email || null,
        p_resource_accessed: params.resourceAccessed || null,
        p_action_attempted: params.actionAttempted || null,
        p_success: params.success || false,
        p_risk_level: params.riskLevel || 'low',
        p_metadata: params.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const logAuthFailure = (reason: string) => {
    logSecurityEvent({
      eventType: 'auth_failure',
      actionAttempted: 'authentication',
      success: false,
      riskLevel: 'medium',
      metadata: { reason, userAgent: navigator.userAgent }
    });
  };

  const logSuspiciousActivity = (activity: string, details?: Record<string, any>) => {
    logSecurityEvent({
      eventType: 'suspicious_activity',
      actionAttempted: activity,
      success: false,
      riskLevel: 'high',
      metadata: { ...details, userAgent: navigator.userAgent }
    });
  };

  const logAdminAction = (action: string, resourceId?: string, success: boolean = true) => {
    logSecurityEvent({
      eventType: 'admin_action',
      resourceAccessed: resourceId,
      actionAttempted: action,
      success,
      riskLevel: success ? 'low' : 'medium',
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  const logDataAccessViolation = (table: string, attemptedAction: string) => {
    logSecurityEvent({
      eventType: 'data_access_violation',
      resourceAccessed: table,
      actionAttempted: attemptedAction,
      success: false,
      riskLevel: 'critical',
      metadata: { 
        table, 
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent 
      }
    });
  };

  const logXSSAttempt = (input: string, location: string) => {
    logSecurityEvent({
      eventType: 'xss_attempt',
      resourceAccessed: location,
      actionAttempted: 'script_injection',
      success: false,
      riskLevel: 'critical',
      metadata: { 
        sanitizedInput: input.substring(0, 100), // Only log first 100 chars for security
        location,
        userAgent: navigator.userAgent
      }
    });
  };

  // Monitor for suspicious patterns
  useEffect(() => {
    const monitorConsoleErrors = () => {
      const originalError = console.error;
      console.error = (...args) => {
        const errorMessage = args.join(' ');
        
        // Detect potential security issues in console errors
        if (errorMessage.includes('RLS policy') || 
            errorMessage.includes('permission denied') ||
            errorMessage.includes('access denied')) {
          logDataAccessViolation('unknown', 'policy_violation');
        }
        
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    };

    const cleanup = monitorConsoleErrors();
    return cleanup;
  }, []);

  return {
    logSecurityEvent,
    logAuthFailure,
    logSuspiciousActivity,
    logAdminAction,
    logDataAccessViolation,
    logXSSAttempt,
  };
};