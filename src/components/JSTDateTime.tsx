import React, { useState, useEffect } from 'react';
import { timezoneUtils, JSTDateFormatter } from '@/lib/timezone';

interface JSTDateTimeProps {
  date: Date | string;
  format?: 'short' | 'long' | 'time' | 'dateTime' | 'full' | 'relative';
  showTimezone?: boolean;
  className?: string;
  live?: boolean; // For live updating time
}

export const JSTDateTime: React.FC<JSTDateTimeProps> = ({
  date,
  format = 'dateTime',
  showTimezone = false,
  className = '',
  live = false
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [displayTime, setDisplayTime] = useState<Date>(new Date());

  useEffect(() => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setDisplayTime(timezoneUtils.parseFromDatabase(dateObj.toISOString()));
  }, [date]);

  useEffect(() => {
    if (live) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [live]);

  const formatTime = (dateToFormat: Date) => {
    switch (format) {
      case 'short':
        return JSTDateFormatter.short(dateToFormat);
      case 'long':
        return JSTDateFormatter.long(dateToFormat);
      case 'time':
        return JSTDateFormatter.time(dateToFormat);
      case 'dateTime':
        return JSTDateFormatter.dateTime(dateToFormat);
      case 'full':
        return JSTDateFormatter.full(dateToFormat);
      case 'relative':
        return timezoneUtils.getRelativeTime(dateToFormat);
      default:
        return JSTDateFormatter.dateTime(dateToFormat);
    }
  };

  const timezoneSuffix = showTimezone ? ' (JST)' : '';

  return (
    <span className={className}>
      {formatTime(displayTime)}{timezoneSuffix}
    </span>
  );
};

// Live clock component
export const JSTLiveClock: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(timezoneUtils.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      {JSTDateFormatter.dateTime(currentTime)} (JST)
    </span>
  );
};

// Business hours indicator
export const JSTBusinessHours: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isBusinessHours, setIsBusinessHours] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const updateStatus = () => {
      const now = timezoneUtils.now();
      setCurrentTime(now);
      setIsBusinessHours(timezoneUtils.isBusinessHours(now));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isBusinessHours ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm">
        {isBusinessHours ? '営業時間内' : '営業時間外'}
      </span>
      <span className="text-xs text-gray-500">
        {JSTDateFormatter.time(currentTime)}
      </span>
    </div>
  );
};

// Date range picker with JST
export const JSTDateRangePicker: React.FC<{
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  className?: string;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange, className = '' }) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value + 'T00:00:00+09:00'); // JST
      onStartDateChange(date);
    } else {
      onStartDateChange(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value + 'T23:59:59+09:00'); // JST end of day
      onEndDateChange(date);
    } else {
      onEndDateChange(null);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return timezoneUtils.getJSTDateString(date);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          開始日
        </label>
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          終了日
        </label>
        <input
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
    </div>
  );
};
