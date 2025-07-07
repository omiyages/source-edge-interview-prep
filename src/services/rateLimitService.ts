// Rate limiting service for login attempts

interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

class RateLimitService {
  private attempts: Map<string, LoginAttempt> = new Map();
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 60000; // 1 minute in milliseconds
  private readonly attemptWindow = 300000; // 5 minutes in milliseconds

  private getKey(email: string): string {
    return email.toLowerCase().trim();
  }

  private isWithinAttemptWindow(lastAttempt: number): boolean {
    return Date.now() - lastAttempt < this.attemptWindow;
  }

  private isCurrentlyLocked(attempt: LoginAttempt): boolean {
    return attempt.lockedUntil ? Date.now() < attempt.lockedUntil : false;
  }

  canAttemptLogin(email: string): { allowed: boolean; remainingAttempts?: number; lockedUntil?: number } {
    const key = this.getKey(email);
    const attempt = this.attempts.get(key);

    if (!attempt) {
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    // Check if currently locked
    if (this.isCurrentlyLocked(attempt)) {
      return { 
        allowed: false, 
        lockedUntil: attempt.lockedUntil 
      };
    }

    // If lockout period has passed, reset attempts
    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
      this.attempts.delete(key);
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    // If outside attempt window, reset attempts
    if (!this.isWithinAttemptWindow(attempt.lastAttempt)) {
      this.attempts.delete(key);
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    // Check if max attempts reached
    if (attempt.attempts >= this.maxAttempts) {
      return { 
        allowed: false, 
        lockedUntil: attempt.lockedUntil 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: this.maxAttempts - attempt.attempts 
    };
  }

  recordFailedAttempt(email: string): { isLocked: boolean; remainingAttempts: number; lockedUntil?: number } {
    const key = this.getKey(email);
    const now = Date.now();
    const existing = this.attempts.get(key);

    let newAttempts = 1;
    if (existing && this.isWithinAttemptWindow(existing.lastAttempt)) {
      newAttempts = existing.attempts + 1;
    }

    const attempt: LoginAttempt = {
      email: key,
      attempts: newAttempts,
      lastAttempt: now,
    };

    // Lock account if max attempts reached
    if (newAttempts >= this.maxAttempts) {
      attempt.lockedUntil = now + this.lockoutDuration;
      this.attempts.set(key, attempt);
      return { 
        isLocked: true, 
        remainingAttempts: 0, 
        lockedUntil: attempt.lockedUntil 
      };
    }

    this.attempts.set(key, attempt);
    return { 
      isLocked: false, 
      remainingAttempts: this.maxAttempts - newAttempts 
    };
  }

  recordSuccessfulLogin(email: string): void {
    const key = this.getKey(email);
    this.attempts.delete(key);
  }

  getRemainingLockoutTime(email: string): number {
    const key = this.getKey(email);
    const attempt = this.attempts.get(key);
    
    if (!attempt || !attempt.lockedUntil) {
      return 0;
    }

    const remaining = attempt.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      // Remove entries that are outside the attempt window and not locked
      if (!attempt.lockedUntil && !this.isWithinAttemptWindow(attempt.lastAttempt)) {
        this.attempts.delete(key);
      }
      // Remove entries where lockout has expired
      else if (attempt.lockedUntil && now >= attempt.lockedUntil) {
        this.attempts.delete(key);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();

// Clean up every 5 minutes
setInterval(() => {
  rateLimitService.cleanup();
}, 300000);