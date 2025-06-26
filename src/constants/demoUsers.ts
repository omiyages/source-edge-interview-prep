
// Demo credentials with valid email formats
export const DEMO_USERS = {
  'admin@example.com': { password: 'sourceedge2025', role: 'admin' as const },
  'user@example.com': { password: 'user2025', role: 'user' as const }
} as const;

export const USERNAME_TO_EMAIL_MAP = {
  'sourceedge': 'admin@example.com',
  'sourceuser': 'user@example.com'
} as const;
