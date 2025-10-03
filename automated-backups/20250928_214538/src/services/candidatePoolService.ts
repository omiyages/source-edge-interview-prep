import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CandidateData {
  name: string;
  email: string;
  skills: string[];
  experience: number;
  linkedInProfile?: string;
  status: 'active' | 'interviewing' | 'hired' | 'rejected';
}

class CandidatePoolService {
  private auth: OAuth2Client | null = null;
  private readonly SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
  private readonly SHEET_ID = ''; // TODO: Add your Google Sheet ID here

  async initializeGoogleAuth(credentials: any) {
    this.auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
    return this.auth;
  }

  async fetchCandidatesFromSheet(): Promise<CandidateData[]> {
    if (!this.auth) {
      throw new Error('Google Auth not initialized');
    }

    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.SHEET_ID,
      range: 'Candidates!A2:F', // Adjust range based on your sheet structure
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row: any[]): CandidateData => ({
      name: row[0] || '',
      email: row[1] || '',
      skills: (row[2] || '').split(',').map(skill => skill.trim()),
      experience: parseInt(row[3]) || 0,
      linkedInProfile: row[4] || undefined,
      status: row[5] as CandidateData['status'] || 'active',
    }));
  }

  // TODO: Add LinkedIn API integration methods here
  async fetchLinkedInData(profileUrl: string) {
    // Implementation will depend on LinkedIn API access level
    throw new Error('LinkedIn integration not implemented yet');
  }
}

export const candidatePoolService = new CandidatePoolService(); 