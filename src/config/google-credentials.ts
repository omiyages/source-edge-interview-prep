import { environment } from './environment';

// Secure Google OAuth Configuration
export const googleConfig = {
  client_id: environment.google.clientId,
  client_secret: environment.google.clientSecret,
  redirect_uri: environment.google.redirectUri || 'http://localhost:5173/oauth2callback',
  sheet_id: environment.google.sheetId,
};

// Security: Validate Google configuration
export const validateGoogleConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!googleConfig.client_id) {
    errors.push('Google Client ID is required');
  }
  
  if (!googleConfig.client_secret) {
    errors.push('Google Client Secret is required');
  }
  
  if (!googleConfig.redirect_uri) {
    errors.push('Google Redirect URI is required');
  }
  
  // Check for placeholder values
  if (googleConfig.client_id.includes('your_google_client_id_here')) {
    errors.push('Google Client ID appears to be a placeholder');
  }
  
  if (googleConfig.client_secret.includes('your_google_client_secret_here')) {
    errors.push('Google Client Secret appears to be a placeholder');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Security: Get Google configuration for API calls (only expose non-sensitive data)
export const getGoogleAPIConfig = () => {
  const validation = validateGoogleConfig();
  
  return {
    clientId: googleConfig.client_id,
    redirectUri: googleConfig.redirect_uri,
    sheetId: googleConfig.sheet_id,
    isValid: validation.isValid,
  };
}; 