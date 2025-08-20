
// ABOUTME: Token encryption service for securing OAuth tokens and sensitive data
// ABOUTME: Provides client-side encryption for Google Sheets and other API tokens

import { supabase } from '@/integrations/supabase/client';

class TokenEncryptionService {
  private readonly ENCRYPTION_KEY_LENGTH = 32;
  
  // Generate a random encryption key (in production, this should be derived from user credentials)
  private async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Derive key from user session (simplified approach)
  private async deriveKeyFromSession(): Promise<CryptoKey> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No active session for key derivation');
    }

    // Use a portion of the access token as key material (simplified)
    const keyMaterial = new TextEncoder().encode(session.access_token.slice(0, 32));
    const paddedKey = new Uint8Array(32);
    paddedKey.set(keyMaterial);

    return await window.crypto.subtle.importKey(
      'raw',
      paddedKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptToken(token: string): Promise<{ encryptedData: string; iv: string }> {
    try {
      const key = await this.deriveKeyFromSession();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedToken = new TextEncoder().encode(token);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedToken
      );

      return {
        encryptedData: Array.from(new Uint8Array(encryptedBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        iv: Array.from(iv)
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  async decryptToken(encryptedData: string, iv: string): Promise<string> {
    try {
      const key = await this.deriveKeyFromSession();
      const ivArray = new Uint8Array(
        iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const encryptedArray = new Uint8Array(
        encryptedData.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray,
        },
        key,
        encryptedArray
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt token');
    }
  }

  // Check if token is expired
  isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  // Generate secure token expiration time (24 hours from now)
  generateExpirationTime(): string {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24);
    return expirationTime.toISOString();
  }
}

export const tokenEncryptionService = new TokenEncryptionService();
