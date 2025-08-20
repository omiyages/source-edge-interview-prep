
// ABOUTME: Sensitive data protection utilities for filtering and masking PII
// ABOUTME: Prevents exposure of personal and confidential information

interface SensitiveFieldConfig {
  tableName: string;
  sensitiveFields: string[];
  maskingRules: Record<string, (value: any) => string>;
}

const SENSITIVE_DATA_CONFIG: SensitiveFieldConfig[] = [
  {
    tableName: 'candidates',
    sensitiveFields: ['email', 'phone_number', 'linkedin_profile', 'salary', 'general_notes'],
    maskingRules: {
      email: (email: string) => email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
      phone_number: (phone: string) => phone ? `***-***-${phone.slice(-4)}` : '',
      salary: (salary: number) => salary ? `$${Math.round(salary / 10000) * 10}k+` : '',
      linkedin_profile: () => '[REDACTED]',
      general_notes: () => '[PRIVATE NOTES]'
    }
  },
  {
    tableName: 'profiles',
    sensitiveFields: ['email', 'phone_number', 'linkedin_profile', 'salary', 'general_notes'],
    maskingRules: {
      email: (email: string) => email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
      phone_number: (phone: string) => phone ? `***-***-${phone.slice(-4)}` : '',
      salary: (salary: number) => salary ? `$${Math.round(salary / 10000) * 10}k+` : '',
      linkedin_profile: () => '[REDACTED]',
      general_notes: () => '[PRIVATE NOTES]'
    }
  },
  {
    tableName: 'google_sheets_integrations',
    sensitiveFields: ['access_token', 'encrypted_token'],
    maskingRules: {
      access_token: () => '[ENCRYPTED]',
      encrypted_token: () => '[ENCRYPTED]'
    }
  }
];

export const maskSensitiveData = (data: any[], tableName: string, userRole?: string): any[] => {
  if (userRole === 'admin') {
    return data; // Admins can see all data
  }

  const config = SENSITIVE_DATA_CONFIG.find(c => c.tableName === tableName);
  if (!config) return data;

  return data.map(item => {
    const maskedItem = { ...item };
    
    config.sensitiveFields.forEach(field => {
      if (maskedItem[field] !== undefined) {
        const maskingRule = config.maskingRules[field];
        if (maskingRule) {
          maskedItem[field] = maskingRule(maskedItem[field]);
        } else {
          maskedItem[field] = '[REDACTED]';
        }
      }
    });

    return maskedItem;
  });
};

export const filterSensitiveFields = (query: any, tableName: string, userRole?: string) => {
  if (userRole === 'admin') {
    return query; // Admins can access all fields
  }

  const config = SENSITIVE_DATA_CONFIG.find(c => c.tableName === tableName);
  if (!config) return query;

  // For non-admin users, exclude sensitive fields from the query
  const safeFields = getAllowedFields(tableName);
  return query.select(safeFields.join(', '));
};

const getAllowedFields = (tableName: string): string[] => {
  const basicFields = ['id', 'created_at', 'updated_at'];
  
  switch (tableName) {
    case 'candidates':
      return [...basicFields, 'full_name', 'current_company', 'years_of_experience', 'skillsets', 'is_active'];
    case 'profiles':
      return [...basicFields, 'full_name', 'role', 'current_company', 'years_of_experience', 'skillsets', 'is_active'];
    case 'google_sheets_integrations':
      return [...basicFields, 'sheet_id', 'sheet_name', 'is_active', 'last_sync_at'];
    default:
      return basicFields;
  }
};

export const checkDataAccessPermission = (tableName: string, operation: string, userRole?: string, userId?: string, targetUserId?: string): boolean => {
  // Admin users have full access
  if (userRole === 'admin') {
    return true;
  }

  // Regular users can only access their own data
  if (operation === 'SELECT' || operation === 'UPDATE') {
    return userId === targetUserId;
  }

  // Deny access to sensitive operations for non-admin users
  if (['DELETE', 'INSERT'].includes(operation)) {
    return false;
  }

  return false;
};
