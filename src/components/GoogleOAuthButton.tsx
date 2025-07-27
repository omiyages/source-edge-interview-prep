
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink } from 'lucide-react';

interface GoogleOAuthButtonProps {
  onTokenReceived: (token: string) => void;
  disabled?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onTokenReceived,
  disabled = false,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = () => {
    setIsAuthenticating(true);
    
    // Google OAuth 2.0 parameters
    const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should be configured in your environment
    const redirectUri = window.location.origin + '/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly';
    const responseType = 'token';
    
    // Construct OAuth URL
    const authUrl = `https://accounts.google.com/oauth/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `access_type=offline`;

    // Open OAuth window
    const authWindow = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Listen for the OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        onTokenReceived(event.data.token);
        setIsAuthenticating(false);
        authWindow?.close();
        toast({
          title: 'Authentication successful',
          description: 'You can now access private Google Sheets.',
        });
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setIsAuthenticating(false);
        authWindow?.close();
        toast({
          title: 'Authentication failed',
          description: event.data.error || 'Failed to authenticate with Google.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Clean up event listener when window is closed
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setIsAuthenticating(false);
      }
    }, 1000);
  };

  return (
    <Button
      onClick={handleGoogleAuth}
      disabled={disabled || isAuthenticating}
      variant="outline"
      className="w-full"
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      {isAuthenticating ? 'Authenticating...' : 'Authenticate with Google'}
    </Button>
  );
};
