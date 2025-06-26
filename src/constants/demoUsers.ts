
// Demo credentials with valid email formats
export const DEMO_USERS = {
  'admin@sourceedge.dev': { password: 'sourceedge2025', role: 'admin' as const },
  'user@sourceedge.dev': { password: 'user2025', role: 'user' as const }
} as const;

export const USERNAME_TO_EMAIL_MAP = {
  'sourceedge': 'admin@sourceedge.dev',
  'sourceuser': 'user@sourceedge.dev'
} as const;
