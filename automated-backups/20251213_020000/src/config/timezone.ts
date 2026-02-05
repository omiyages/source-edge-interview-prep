// Global timezone configuration for Japan Standard Time (JST)
export const TIMEZONE_CONFIG = {
  // Primary timezone
  timezone: 'Asia/Tokyo',
  
  // UTC offset in hours
  offset: 9,
  
  // Locale settings
  locale: 'ja-JP',
  
  // Date format preferences
  dateFormats: {
    short: 'YYYY/MM/DD',
    long: 'YYYY年MM月DD日',
    time: 'HH:mm',
    dateTime: 'YYYY/MM/DD HH:mm',
    full: 'YYYY年MM月DD日 HH時mm分'
  },
  
  // Business hours (JST)
  businessHours: {
    start: 9, // 9 AM
    end: 18,  // 6 PM
    days: [1, 2, 3, 4, 5] // Monday to Friday
  },
  
  // Holidays in Japan (2024-2025)
  holidays: [
    '2024-01-01', // New Year's Day
    '2024-01-08', // Coming of Age Day
    '2024-02-11', // National Foundation Day
    '2024-02-12', // National Foundation Day (observed)
    '2024-02-23', // Emperor's Birthday
    '2024-03-20', // Vernal Equinox Day
    '2024-04-29', // Showa Day
    '2024-05-03', // Constitution Memorial Day
    '2024-05-04', // Greenery Day
    '2024-05-05', // Children's Day
    '2024-05-06', // Children's Day (observed)
    '2024-07-15', // Marine Day
    '2024-08-11', // Mountain Day
    '2024-08-12', // Mountain Day (observed)
    '2024-09-16', // Respect for the Aged Day
    '2024-09-22', // Autumnal Equinox Day
    '2024-09-23', // Autumnal Equinox Day (observed)
    '2024-10-14', // Sports Day
    '2024-11-03', // Culture Day
    '2024-11-04', // Culture Day (observed)
    '2024-11-23', // Labor Thanksgiving Day
    '2024-12-23', // Emperor's Birthday
    '2024-12-30', // Bank Holiday
    '2024-12-31', // Bank Holiday
    '2025-01-01', // New Year's Day
    '2025-01-13', // Coming of Age Day
    '2025-02-11', // National Foundation Day
    '2025-02-23', // Emperor's Birthday
    '2025-03-20', // Vernal Equinox Day
    '2025-04-29', // Showa Day
    '2025-05-03', // Constitution Memorial Day
    '2025-05-04', // Greenery Day
    '2025-05-05', // Children's Day
    '2025-05-06', // Children's Day (observed)
    '2025-07-21', // Marine Day
    '2025-08-11', // Mountain Day
    '2025-09-15', // Respect for the Aged Day
    '2025-09-23', // Autumnal Equinox Day
    '2025-10-13', // Sports Day
    '2025-11-03', // Culture Day
    '2025-11-23', // Labor Thanksgiving Day
    '2025-11-24', // Labor Thanksgiving Day (observed)
    '2025-12-23', // Emperor's Birthday
  ]
};

// Utility functions for JST
export const jstUtils = {
  // Check if date is a Japanese holiday
  isHoliday: (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return TIMEZONE_CONFIG.holidays.includes(dateString);
  },
  
  // Check if date is a business day
  isBusinessDay: (date: Date): boolean => {
    const day = date.getDay();
    const isWeekday = day >= 1 && day <= 5; // Monday to Friday
    const isNotHoliday = !jstUtils.isHoliday(date);
    return isWeekday && isNotHoliday;
  },
  
  // Get next business day
  getNextBusinessDay: (date: Date = new Date()): Date => {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!jstUtils.isBusinessDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  },
  
  // Get business days in range
  getBusinessDaysInRange: (startDate: Date, endDate: Date): Date[] => {
    const businessDays: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (jstUtils.isBusinessDay(current)) {
        businessDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  },
  
  // Format date for Japanese locale
  formatJapanese: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return date.toLocaleDateString('ja-JP', {
      timeZone: TIMEZONE_CONFIG.timezone,
      ...options
    });
  },
  
  // Get current JST time
  now: (): Date => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.timezone }));
  }
};
