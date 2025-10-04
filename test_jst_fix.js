// Test JST fix for interview dates
console.log('🧪 Testing JST fix for interview dates...');

// Simulate the JSTDateTime component logic
const testDate = new Date("2025-10-10T13:00:00.000Z");
console.log('📅 Input date (UTC):', testDate.toISOString());

// Test the parseFromDatabase function (fixed version)
const parseFromDatabase = (isoString) => {
  const utcDate = new Date(isoString);
  return utcDate; // Return UTC date directly
};

const parsedDate = parseFromDatabase("2025-10-10T13:00:00.000Z");
console.log('📅 Parsed date:', parsedDate.toISOString());

// Test the formatJST function
const formatJST = (date, options = {}) => {
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    ...options
  });
};

// Test the JSTDateFormatter.dateTime function
const formatDateTime = (date) => {
  return formatJST(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

console.log('🇯🇵 JST DateTime format:', formatDateTime(parsedDate));

// Test the complete JSTDateTime component flow
const JSTDateTimeComponent = (date, format = 'dateTime') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const displayTime = dateObj; // Using the fixed parseFromDatabase logic
  
  switch (format) {
    case 'short':
      return formatJST(displayTime, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'dateTime':
      return formatJST(displayTime, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    case 'time':
      return formatJST(displayTime, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    default:
      return formatJST(displayTime);
  }
};

console.log('🧪 JSTDateTime component tests:');
console.log('- format="short":', JSTDateTimeComponent("2025-10-10T13:00:00.000Z", 'short'));
console.log('- format="dateTime":', JSTDateTimeComponent("2025-10-10T13:00:00.000Z", 'dateTime'));
console.log('- format="time":', JSTDateTimeComponent("2025-10-10T13:00:00.000Z", 'time'));

console.log('');
console.log('✅ Expected results:');
console.log('- Short: 2025/10/10');
console.log('- DateTime: 2025/10/10 22:00');
console.log('- Time: 22:00');
console.log('');
console.log('🎯 The fix should show the correct JST time (22:00 = 10 PM JST)');
