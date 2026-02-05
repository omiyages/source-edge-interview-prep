
export const generateSecurePassword = (length: number = 16): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  
  // Use crypto.getRandomValues for cryptographically secure random numbers
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure password meets complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    // Regenerate if requirements not met
    return generateSecurePassword(length);
  }
  
  return password;
};

export const validatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");
  
  if (password.length >= 12) score += 1;
  else if (password.length >= 8) feedback.push("Consider using 12+ characters for better security");
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Include uppercase letters");
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Include lowercase letters");
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Include numbers");
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push("Include special characters");
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push("Avoid repeating characters");
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    score -= 2;
    feedback.push("Avoid common patterns and words");
  }
  
  return { score: Math.max(0, score), feedback };
};
