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

export class DatabaseUserService {
  /**
   * Check if a user already exists by email
   */
  static async checkUserExists(email: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      return { 
        exists: !error && data !== null,
        userId: data?.id
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Delete existing user and profile to allow recreation
   */
  static async deleteExistingUser(email: string): Promise<boolean> {
    try {
      // First, get the user ID from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        return false;
      }

      // Delete from profiles first (due to foreign key constraint)
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileData.id);

      if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError);
        return false;
      }

      // Note: We can't delete from auth.users directly via client
      // The auth user will remain but without a profile
      return true;
    } catch (error) {
      console.error('Error deleting existing user:', error);
      return false;
    }
  }

  /**
   * Create a user through Supabase Auth and then create profile
   */
  static async createUser(userData: CreateUserData): Promise<BulkUserResult> {
    try {
      // Check if user already exists
      const userCheck = await this.checkUserExists(userData.email);
      if (userCheck.exists) {
        // User already exists, skip creation
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'skipped',
          message: 'User already exists'
        };
      }

      // Step 1: Create user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role || 'user'
          }
        }
      });

      if (authError) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'error',
          message: `Auth creation failed: ${authError.message}`
        };
      }

      if (!authData.user) {
        return {
          name: userData.fullName,
          email: userData.email,
          status: 'error',
          message: 'No user data returned from auth'
        };
      }

      // Step 2: Create profile with the auth user ID
      const possibleRoles = ['user', 'admin', 'candidate', 'student'];
      let lastError = null;

      for (const role of possibleRoles) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id, // Use the auth user ID
              full_name: userData.fullName,
              email: userData.email,
              role: role,
              position: userData.position || 'Unassigned',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (!profileError) {
            return {
              name: userData.fullName,
              email: userData.email,
              status: 'success',
              message: `User created successfully with role: ${role}`
            };
          } else {
            lastError = profileError;
            // If it's not an enum error, break out of the loop
            if (!profileError.message.includes('enum')) {
              break;
            }
          }
        } catch (err) {
          lastError = err;
          if (!(err instanceof Error && err.message.includes('enum'))) {
            break;
          }
        }
      }

      return {
        name: userData.fullName,
        email: userData.email,
        status: 'error',
        message: lastError?.message || 'Failed to create profile with any valid role'
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
   * Clean up existing users with empty names
   */
  static async cleanupEmptyUsers(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      // Find profiles with empty or null full_name
      const { data: emptyProfiles, error: selectError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .or('full_name.is.null,full_name.eq.');

      if (selectError) {
        errors.push(`Error finding empty profiles: ${selectError.message}`);
        return { cleaned: 0, errors };
      }

      if (!emptyProfiles || emptyProfiles.length === 0) {
        return { cleaned: 0, errors: [] };
      }

      // Delete empty profiles
      for (const profile of emptyProfiles) {
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (deleteError) {
          errors.push(`Error deleting profile ${profile.email}: ${deleteError.message}`);
        } else {
          cleaned++;
        }
      }

      return { cleaned, errors };
    } catch (error) {
      errors.push(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { cleaned, errors };
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
        role: 'user',
        position: 'Unassigned'
      };

      const result = await this.createUser(userData);
      results.push(result);
    }

    return results;
  }

  /**
   * Check which users already exist before bulk creation
   */
  static async checkExistingUsers(names: string[]): Promise<{ existing: string[]; newUsers: string[] }> {
    const existing: string[] = [];
    const newUsers: string[] = [];

    for (const name of names) {
      const email = this.generateEmail(name);
      const userCheck = await this.checkUserExists(email);
      
      if (userCheck.exists) {
        existing.push(name);
      } else {
        newUsers.push(name);
      }
    }

    return { existing, newUsers };
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
