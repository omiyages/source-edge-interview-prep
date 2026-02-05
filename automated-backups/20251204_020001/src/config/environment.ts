/**
 * Secure Environment Configuration
 * Centralized environment variable management with validation and security
 */

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Google OAuth Configuration
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    sheetId: string;
  };
  
  // Security Configuration
  security: {
    headersEnabled: boolean;
    rateLimitingEnabled: boolean;
    debugMode: boolean;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
  };
  
  // Monitoring Configuration
  monitoring: {
    enabled: boolean;
    analyticsId: string;
  };
  
  // Feature Flags
  features: {
    kanban: boolean;
    bulkAdd: boolean;
    securityMonitoring: boolean;
  };
}

class EnvironmentManager {
  private config: EnvironmentConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.config = this.loadAndValidateConfig();
  }

  private loadAndValidateConfig(): EnvironmentConfig {
    // Load environment variables with fallbacks
    const supabaseUrl = this.getOptionalEnvVar('VITE_SUPABASE_URL', 'https://satshobhbkjptsbmfsia.supabase.co');
    const supabaseAnonKey = this.getOptionalEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c');
    
    const googleClientId = this.getOptionalEnvVar('VITE_GOOGLE_CLIENT_ID', '');
    const googleClientSecret = this.getOptionalEnvVar('VITE_GOOGLE_CLIENT_SECRET', '');
    const googleRedirectUri = this.getOptionalEnvVar('VITE_GOOGLE_REDIRECT_URI', '');
    const googleSheetId = this.getOptionalEnvVar('VITE_GOOGLE_SHEET_ID', '');
    
    const securityHeadersEnabled = this.getBooleanEnvVar('VITE_SECURITY_HEADERS_ENABLED', true);
    const rateLimitingEnabled = this.getBooleanEnvVar('VITE_RATE_LIMITING_ENABLED', true);
    const debugMode = this.getBooleanEnvVar('VITE_DEBUG_MODE', false);
    
    const apiBaseUrl = this.getOptionalEnvVar('VITE_API_BASE_URL', '');
    const apiTimeout = this.getNumberEnvVar('VITE_API_TIMEOUT', 30000);
    
    const monitoringEnabled = this.getBooleanEnvVar('VITE_MONITORING_ENABLED', true);
    const analyticsId = this.getOptionalEnvVar('VITE_ANALYTICS_ID', '');
    
    const kanbanEnabled = this.getBooleanEnvVar('VITE_FEATURE_KANBAN_ENABLED', true);
    const bulkAddEnabled = this.getBooleanEnvVar('VITE_FEATURE_BULK_ADD_ENABLED', true);
    const securityMonitoringEnabled = this.getBooleanEnvVar('VITE_FEATURE_SECURITY_MONITORING', true);

    return {
      supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      },
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: googleRedirectUri,
        sheetId: googleSheetId,
      },
      security: {
        headersEnabled: securityHeadersEnabled,
        rateLimitingEnabled: rateLimitingEnabled,
        debugMode: debugMode,
      },
      api: {
        baseUrl: apiBaseUrl,
        timeout: apiTimeout,
      },
      monitoring: {
        enabled: monitoringEnabled,
        analyticsId: analyticsId,
      },
      features: {
        kanban: kanbanEnabled,
        bulkAdd: bulkAddEnabled,
        securityMonitoring: securityMonitoringEnabled,
      },
    };
  }

  private getRequiredEnvVar(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private getOptionalEnvVar(key: string, defaultValue: string): string {
    return import.meta.env[key] || defaultValue;
  }

  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getNumberEnvVar(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Public getters with security checks
  get supabase() {
    return this.config.supabase;
  }

  get google() {
    // Only expose non-sensitive Google config in production
    if (this.isProduction) {
      return {
        clientId: this.config.google.clientId,
        redirectUri: this.config.google.redirectUri,
        sheetId: this.config.google.sheetId,
      };
    }
    return this.config.google;
  }

  get security() {
    return this.config.security;
  }

  get api() {
    return this.config.api;
  }

  get monitoring() {
    return this.config.monitoring;
  }

  get features() {
    return this.config.features;
  }

  // Security validation methods
  validateSecrets(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for hardcoded secrets
    if (this.config.supabase.url.includes('localhost') && this.isProduction) {
      errors.push('Supabase URL appears to be localhost in production');
    }

    if (this.config.supabase.anonKey.length < 20) {
      errors.push('Supabase anon key appears to be too short');
    }

    // Check for placeholder values
    if (this.config.supabase.url.includes('your_supabase_url_here')) {
      errors.push('Supabase URL appears to be a placeholder');
    }

    if (this.config.supabase.anonKey.includes('your_supabase_anon_key_here')) {
      errors.push('Supabase anon key appears to be a placeholder');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Debug information (only in development)
  getDebugInfo(): Record<string, any> {
    if (this.isProduction) {
      return { message: 'Debug info not available in production' };
    }

    return {
      environment: this.isProduction ? 'production' : 'development',
      supabase: {
        url: this.config.supabase.url,
        anonKeyLength: this.config.supabase.anonKey.length,
      },
      security: this.config.security,
      features: this.config.features,
    };
  }
}

// Export singleton instance
export const environment = new EnvironmentManager();

// Export types for use in other files
export type { EnvironmentConfig };
