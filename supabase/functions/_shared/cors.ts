
const ALLOWED_ORIGINS = [
  'https://omiyages.com',
  'https://www.omiyages.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Legacy export for callers that haven't migrated yet — defaults to production origin
export const corsHeaders = getCorsHeaders(null);
