export const googleConfig = {
  client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
  client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
  redirect_uri: process.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth2callback',
  sheet_id: process.env.VITE_GOOGLE_SHEET_ID || '',
}; 