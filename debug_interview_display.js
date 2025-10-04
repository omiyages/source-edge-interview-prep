// Debug interview date display in Kanban board
console.log('🔍 Debugging interview date display in Kanban board...');

// Test data that might be coming from the database
const testInterviewData = {
  upcoming_interview_name: "Candidate Call",
  upcoming_interview_date: "2025-10-10T13:00:00.000Z", // UTC time
  user_id: "test-user-id"
};

console.log('📊 Test interview data:');
console.log('Interview name:', testInterviewData.upcoming_interview_name);
console.log('Interview date (raw):', testInterviewData.upcoming_interview_date);

// Test different date formats
const testDate = new Date(testInterviewData.upcoming_interview_date);
console.log('📅 Parsed date:', testDate);
console.log('📅 ISO string:', testDate.toISOString());
console.log('📅 UTC string:', testDate.toUTCString());

// Test JST conversion
const jstDate = new Date(testDate.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
console.log('🇯🇵 JST date:', jstDate);

// Test different JST formats
console.log('📋 JST format tests:');
console.log('- Short (date only):', testDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }));
console.log('- DateTime:', testDate.toLocaleString('ja-JP', { 
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}));

// Test the JSTDateTime component logic
const formatJSTDateTime = (date, format = 'dateTime') => {
  const jstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  
  switch (format) {
    case 'short':
      return jstDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    case 'dateTime':
      return jstDate.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    case 'time':
      return jstDate.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    default:
      return jstDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  }
};

console.log('🧪 JSTDateTime component tests:');
console.log('- format="short":', formatJSTDateTime(testDate, 'short'));
console.log('- format="dateTime":', formatJSTDateTime(testDate, 'dateTime'));
console.log('- format="time":', formatJSTDateTime(testDate, 'time'));

console.log('');
console.log('🎯 Expected results:');
console.log('- Kanban board should show: "2025/10/10 22:00" (JST)');
console.log('- The time should be 22:00 JST (9 PM JST)');
console.log('- This corresponds to 13:00 UTC (1 PM UTC)');
console.log('');
console.log('🔧 If the display is wrong, check:');
console.log('1. Database function returns correct date format');
console.log('2. JSTDateTime component is working correctly');
console.log('3. Timezone conversion is accurate');
