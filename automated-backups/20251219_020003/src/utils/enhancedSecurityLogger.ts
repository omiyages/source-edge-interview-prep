// ABOUTME: Enhanced security logger with database persistence and threat detection
// ABOUTME: Integrates with the enhanced_security_events table for comprehensive monitoring

import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType = 
  | 'auth_failure' 
  | 'rate_limit_exceeded' 
  | 'suspicious_activity' 
  | 'admin_action' 
  | 'data_access_violation' 
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'injection_attempt'
  | 'privilege_escalation';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface EnhancedSecurityEvent {
  eventType: SecurityEventType;
  resourceAccessed?: string;
  actionAttempted?: string;
  success?: boolean;
  riskLevel?: RiskLevel;
  metadata?: Record<string, any>;
}

class EnhancedSecurityLogger {
  private static instance: EnhancedSecurityLogger;
  private eventQueue: EnhancedSecurityEvent[] = [];
  private isProcessing = false;

  static getInstance(): EnhancedSecurityLogger {
    if (!EnhancedSecurityLogger.instance) {
      EnhancedSecurityLogger.instance = new EnhancedSecurityLogger();
    }
    return EnhancedSecurityLogger.instance;
  }

  async logEvent(event: EnhancedSecurityEvent) {
    // Add to queue for batch processing
    this.eventQueue.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent || 'Unknown',
        url: window?.location?.href || 'Unknown'
      }
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.eventQueue.length === 0 || this.isProcessing) return;

    this.isProcessing = true;

    try {
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];

      // Process events in batch
      await Promise.all(
        eventsToProcess.map(event => this.persistEvent(event))
      );
    } catch (error) {
      console.error('Failed to process security events queue:', error);
      // Re-add failed events back to queue for retry
      this.eventQueue.unshift(...this.eventQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private async persistEvent(event: EnhancedSecurityEvent) {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: event.eventType,
        p_resource_accessed: event.resourceAccessed || null,
        p_action_attempted: event.actionAttempted || null,
        p_success: event.success || false,
        p_risk_level: event.riskLevel || 'low',
        p_metadata: event.metadata || {}
      });
    } catch (error) {
      console.error('Failed to persist security event:', error);
      throw error;
    }
  }

  // Convenience methods for common security events
  async logAuthFailure(reason: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'auth_failure',
      actionAttempted: 'authentication',
      success: false,
      riskLevel: 'medium',
      metadata: { reason, ...metadata }
    });
  }

  async logSuspiciousActivity(activity: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'suspicious_activity',
      actionAttempted: activity,
      success: false,
      riskLevel: 'high',
      metadata
    });
  }

  async logAdminAction(action: string, resourceId?: string, success: boolean = true, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'admin_action',
      resourceAccessed: resourceId,
      actionAttempted: action,
      success,
      riskLevel: success ? 'low' : 'medium',
      metadata
    });
  }

  async logDataAccessViolation(table: string, attemptedAction: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'data_access_violation',
      resourceAccessed: table,
      actionAttempted: attemptedAction,
      success: false,
      riskLevel: 'critical',
      metadata: { table, ...metadata }
    });
  }

  async logXSSAttempt(input: string, location: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'xss_attempt',
      resourceAccessed: location,
      actionAttempted: 'script_injection',
      success: false,
      riskLevel: 'critical',
      metadata: { 
        sanitizedInput: input.substring(0, 100), // Only log first 100 chars
        location,
        ...metadata
      }
    });
  }

  async logInjectionAttempt(type: string, input: string, location: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'injection_attempt',
      resourceAccessed: location,
      actionAttempted: `${type}_injection`,
      success: false,
      riskLevel: 'critical',
      metadata: { 
        injectionType: type,
        sanitizedInput: input.substring(0, 100),
        location,
        ...metadata
      }
    });
  }

  async logPrivilegeEscalation(action: string, targetResource: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'privilege_escalation',
      resourceAccessed: targetResource,
      actionAttempted: action,
      success: false,
      riskLevel: 'critical',
      metadata
    });
  }

  async logRateLimitExceeded(endpoint: string, metadata?: Record<string, any>) {
    return this.logEvent({
      eventType: 'rate_limit_exceeded',
      resourceAccessed: endpoint,
      actionAttempted: 'api_request',
      success: false,
      riskLevel: 'medium',
      metadata
    });
  }
}

// Export singleton instance
export const enhancedSecurityLogger = EnhancedSecurityLogger.getInstance();