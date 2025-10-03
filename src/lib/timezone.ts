// Japan Standard Time (JST) Configuration
// JST is UTC+9

export const JST_TIMEZONE = 'Asia/Tokyo';
export const JST_OFFSET = 9; // UTC+9

// Timezone utilities for JST
export const timezoneUtils = {
  // Get current time in JST
  now: (): Date => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
  },

  // Convert UTC date to JST
  utcToJST: (utcDate: Date): Date => {
    return new Date(utcDate.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
  },

  // Convert JST date to UTC
  jstToUTC: (jstDate: Date): Date => {
    const utcTime = jstDate.getTime() - (JST_OFFSET * 60 * 60 * 1000);
    return new Date(utcTime);
  },

  // Format date in JST
  formatJST: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return date.toLocaleString('ja-JP', {
      timeZone: JST_TIMEZONE,
      ...options
    });
  },

  // Format date for display (Japanese format)
  formatForDisplay: (date: Date): string => {
    return date.toLocaleString('ja-JP', {
      timeZone: JST_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  },

  // Format date for database (ISO string in JST)
  formatForDatabase: (date: Date): string => {
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    return jstDate.toISOString();
  },

  // Parse date from database (assuming UTC, convert to JST)
  parseFromDatabase: (isoString: string): Date => {
    const utcDate = new Date(isoString);
    return new Date(utcDate.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
  },

  // Get JST date string for API calls
  getJSTDateString: (date: Date): string => {
    return date.toLocaleDateString('en-CA', { timeZone: JST_TIMEZONE }); // YYYY-MM-DD format
  },

  // Get JST datetime string for API calls
  getJSTDateTimeString: (date: Date): string => {
    return date.toISOString().replace('Z', '+09:00'); // JST offset
  },

  // Check if date is today in JST
  isTodayJST: (date: Date): boolean => {
    const today = new Date();
    const todayJST = new Date(today.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    const dateJST = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    
    return todayJST.toDateString() === dateJST.toDateString();
  },

  // Get relative time in JST (e.g., "2 hours ago")
  getRelativeTime: (date: Date): string => {
    const now = new Date();
    const jstNow = new Date(now.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    
    const diffMs = jstNow.getTime() - jstDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return timezoneUtils.formatForDisplay(jstDate);
  },

  // Get business hours in JST (9 AM - 6 PM JST)
  isBusinessHours: (date: Date = new Date()): boolean => {
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    const hour = jstDate.getHours();
    const day = jstDate.getDay();
    
    // Monday to Friday, 9 AM to 6 PM JST
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  },

  // Get next business day
  getNextBusinessDay: (date: Date = new Date()): Date => {
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }));
    let nextDay = new Date(jstDate);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (nextDay.getDay() === 0 || nextDay.getDay() === 6); // Skip weekends
    
    return nextDay;
  }
};

// React hook for JST timezone
export const useJSTTimezone = () => {
  const [currentTime, setCurrentTime] = useState<Date>(timezoneUtils.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(timezoneUtils.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentTime,
    formatJST: timezoneUtils.formatJST,
    formatForDisplay: timezoneUtils.formatForDisplay,
    getRelativeTime: timezoneUtils.getRelativeTime,
    isBusinessHours: timezoneUtils.isBusinessHours,
  };
};

// Date formatter components
export const JSTDateFormatter = {
  // Short format: 2024/01/15
  short: (date: Date): string => {
    return timezoneUtils.formatJST(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  // Long format: 2024年1月15日
  long: (date: Date): string => {
    return timezoneUtils.formatJST(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  },

  // Time format: 14:30
  time: (date: Date): string => {
    return timezoneUtils.formatJST(date, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  // DateTime format: 2024/01/15 14:30
  dateTime: (date: Date): string => {
    return timezoneUtils.formatJST(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  // Full format: 2024年1月15日 14時30分
  full: (date: Date): string => {
    return timezoneUtils.formatJST(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};
