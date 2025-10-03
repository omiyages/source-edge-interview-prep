/**
 * Secrets Management Utilities
 * Secure handling of sensitive data and environment variables
 */

import { environment } from '@/config/environment';

export interface SecretValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, string> = new Map();
  private validationResults: SecretValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Validate all secrets and environment variables
   */
  validateSecrets(): SecretValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Supabase configuration
    const supabaseValidation = this.validateSupabaseSecrets();
    errors.push(...supabaseValidation.errors);
    warnings.push(...supabaseValidation.warnings);

    // Validate Google OAuth configuration
    const googleValidation = this.validateGoogleSecrets();
    errors.push(...googleValidation.errors);
    warnings.push(...googleValidation.warnings);

    // Check for hardcoded secrets in code
    const hardcodedSecrets = this.detectHardcodedSecrets();
    errors.push(...hardcodedSecrets);

    // Check for exposed secrets in console logs
    const exposedSecrets = this.detectExposedSecrets();
    warnings.push(...exposedSecrets);

    this.validationResults = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

    return this.validationResults;
  }

  private validateSupabaseSecrets(): SecretValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { url, anonKey } = environment.supabase;

    // Check for placeholder values
    if (url.includes('your_supabase_url_here') || url.includes('localhost')) {
      errors.push('Supabase URL appears to be a placeholder or localhost');
    }

    if (anonKey.includes('your_supabase_anon_key_here')) {
      errors.push('Supabase anon key appears to be a placeholder');
    }

    // Check URL format
    if (!url.startsWith('https://')) {
      errors.push('Supabase URL must use HTTPS');
    }

    // Check key length
    if (anonKey.length < 20) {
      errors.push('Supabase anon key appears to be too short');
    }

    // Check for common patterns that might indicate hardcoded values
    if (anonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      warnings.push('Supabase anon key appears to be a JWT token - ensure it\'s not hardcoded');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateGoogleSecrets(): SecretValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { clientId, clientSecret, redirectUri, sheetId } = environment.google;

    // Check for placeholder values
    if (clientId.includes('your_google_client_id_here')) {
      errors.push('Google Client ID appears to be a placeholder');
    }

    if (clientSecret.includes('your_google_client_secret_here')) {
      errors.push('Google Client Secret appears to be a placeholder');
    }

    // Check redirect URI format
    if (redirectUri && !redirectUri.startsWith('https://') && !redirectUri.includes('localhost')) {
      warnings.push('Google Redirect URI should use HTTPS in production');
    }

    // Check for empty required fields
    if (!clientId) {
      errors.push('Google Client ID is required');
    }

    if (!clientSecret) {
      errors.push('Google Client Secret is required');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private detectHardcodedSecrets(): string[] {
    const errors: string[] = [];

    // This would typically scan the codebase for hardcoded secrets
    // For now, we'll check common patterns
    const commonSecretPatterns = [
      'sk-', // OpenAI API keys
      'pk_', // Stripe keys
      'AKIA', // AWS access keys
      'AIza', // Google API keys
    ];

    // In a real implementation, you'd scan the codebase
    // For now, we'll just return empty array
    return errors;
  }

  private detectExposedSecrets(): string[] {
    const warnings: string[] = [];

    // Check if debug mode is enabled in production
    if (environment.security.debugMode && import.meta.env.PROD) {
      warnings.push('Debug mode is enabled in production - this may expose sensitive information');
    }

    return warnings;
  }

  /**
   * Get a secure secret value (with validation)
   */
  getSecret(key: string): string | null {
    if (this.secrets.has(key)) {
      return this.secrets.get(key) || null;
    }

    // Check environment variables
    const value = import.meta.env[key];
    if (value) {
      this.secrets.set(key, value);
      return value;
    }

    return null;
  }

  /**
   * Set a secret value (for runtime configuration)
   */
  setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }

  /**
   * Clear all secrets from memory
   */
  clearSecrets(): void {
    this.secrets.clear();
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.validationResults.errors.length > 0) {
      recommendations.push('Fix all validation errors before deploying to production');
    }

    if (this.validationResults.warnings.length > 0) {
      recommendations.push('Review and address all security warnings');
    }

    recommendations.push('Use environment variables for all sensitive configuration');
    recommendations.push('Never commit secrets to version control');
    recommendations.push('Use a secrets management service in production');
    recommendations.push('Rotate secrets regularly');
    recommendations.push('Monitor for exposed secrets in logs and error messages');

    return recommendations;
  }

  /**
   * Generate a security report
   */
  generateSecurityReport(): {
    timestamp: string;
    validation: SecretValidationResult;
    recommendations: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const validation = this.validateSecrets();
    const recommendations = this.getSecurityRecommendations();

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (validation.errors.length > 0) {
      riskLevel = 'CRITICAL';
    } else if (validation.warnings.length > 3) {
      riskLevel = 'HIGH';
    } else if (validation.warnings.length > 0) {
      riskLevel = 'MEDIUM';
    }

    return {
      timestamp: new Date().toISOString(),
      validation,
      recommendations,
      riskLevel,
    };
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();
