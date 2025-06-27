// Security event logging utility

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_input' | 'admin_action';
  userId?: string;
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    };

    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // In production, you would send this to your logging service
    // For now, we'll just store it locally
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const securityLogger = new SecurityLogger();

// Helper functions for common security events
export const logAuthFailure = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'auth_failure',
    userId,
    details,
  });
};

export const logRateLimitExceeded = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'rate_limit_exceeded',
    userId,
    details,
  });
};

export const logInvalidInput = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'invalid_input',
    userId,
    details,
  });
};

export const logAdminAction = (details: string, userId?: string): void => {
  securityLogger.log({
    type: 'admin_action',
    userId,
    details,
  });
};
