
// Security event logging utility

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_input' | 'admin_action' | 'xss_attempt' | 'suspicious_activity';
  userId?: string;
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('security_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to store security events:', error);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // Alert on critical events
    if (event.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', securityEvent);
    }
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  clearEvents(): void {
    this.events = [];
    try {
      localStorage.removeItem('security_events');
    } catch (error) {
      console.warn('Failed to clear security events:', error);
    }
  }

  // Load events from localStorage on initialization
  loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('security_events');
      if (stored) {
        this.events = JSON.parse(stored).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load stored security events:', error);
    }
  }
}

export const securityLogger = new SecurityLogger();

// Load stored events on initialization
if (typeof window !== 'undefined') {
  securityLogger.loadStoredEvents();
}

// Helper functions for common security events
export const logAuthFailure = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'auth_failure',
    userId,
    details,
    severity: 'high',
  });
};

export const logRateLimitExceeded = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'rate_limit_exceeded',
    userId,
    details,
    severity: 'medium',
  });
};

export const logInvalidInput = (details: string, userId?: string, metadata?: Record<string, any>): void => {
  securityLogger.log({
    type: 'invalid_input',
    userId,
    details,
    severity: 'medium',
    metadata,
  });
};

export const logAdminAction = (details: string, userId?: string, metadata?: Record<string, any>): void => {
  securityLogger.log({
    type: 'admin_action',
    userId,
    details,
    severity: 'low',
    metadata,
  });
};

export const logXSSAttempt = (details: string, userId?: string, metadata?: Record<string, any>): void => {
  securityLogger.log({
    type: 'xss_attempt',
    userId,
    details,
    severity: 'critical',
    metadata,
  });
};

export const logSuspiciousActivity = (details: string, userId?: string, metadata?: Record<string, any>): void => {
  securityLogger.log({
    type: 'suspicious_activity',
    userId,
    details,
    severity: 'high',
    metadata,
  });
};
