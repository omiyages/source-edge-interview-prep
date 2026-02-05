import { supabase } from '@/integrations/supabase/client';

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  position?: string;
}

export interface BulkUserResult {
  name: string;
  email: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

export class UserService {
  /**
   * Check if a user already exists by email
   */
  static async checkUserExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Create a single user
   */
  static async createUser(userData: CreateUserData): Promise<BulkUserResult> {
    try {
      // Check if user already exists
      const exists = await this.checkUserExists(userData.email);
      if (exists) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'skipped',
          message: 'User already exists'
        };
      }

      // Create user using signUp method (regular auth, not admin)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          }
        }
      });

      if (authError) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'error',
          message: authError.message
        };
      }

      if (!authData.user) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'error',
          message: 'Failed to create user account'
        };
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.fullName,
          email: userData.email,
          role: userData.role || 'candidate',
          position: userData.position || 'Unassigned'
        });

      if (profileError) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'error',
          message: profileError.message
        };
      }

      return {
        name: userData.fullName,
        email: userData.email,
        status: 'success',
        message: 'User created successfully'
      };

    } catch (error) {
      return {
        name: userData.fullName,
        email: userData.email,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create multiple users in bulk
   */
  static async createBulkUsers(names: string[]): Promise<BulkUserResult[]> {
    const results: BulkUserResult[] = [];

    for (const name of names) {
      const email = this.generateEmail(name);
      const userData: CreateUserData = {
        fullName: name,
        email,
        password: 'SourceEdge2025!',
        role: 'candidate',
        position: 'Unassigned'
      };

      const result = await this.createUser(userData);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate email from full name
   */
  static generateEmail(fullName: string): string {
    const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, '');
    return `${cleanName}@source-edge.com`;
  }

  /**
   * Parse names from text input
   */
  static parseNames(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Get user statistics from results
   */
  static getStats(results: BulkUserResult[]) {
    const successful = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;
    return { successful, skipped, errors, total: results.length };
  }
}
