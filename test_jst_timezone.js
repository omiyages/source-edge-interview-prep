// Test JST timezone configuration
console.log('🇯🇵 Testing Japan Standard Time (JST) configuration...');

// Test 1: Check timezone configuration
const timezone = document.documentElement.getAttribute('data-timezone');
console.log('📍 Timezone:', timezone);

// Test 2: Test date formatting
const now = new Date();
console.log('🕐 Current UTC time:', now.toISOString());
console.log('🕐 Current JST time:', now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

// Test 3: Test business hours detection
const hour = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour: 'numeric' });
const isBusinessHours = parseInt(hour) >= 9 && parseInt(hour) < 18;
console.log('🏢 Business hours:', isBusinessHours ? '営業時間内' : '営業時間外');

// Test 4: Test Japanese date formatting
const jstDate = new Date().toLocaleString('ja-JP', { 
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
console.log('📅 JST formatted date:', jstDate);

// Test 5: Test relative time
const testDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
const relativeTime = testDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
console.log('⏰ Relative time test:', relativeTime);

// Test 6: Test holiday detection (if implemented)
const today = new Date();
const isHoliday = today.getDay() === 0 || today.getDay() === 6; // Weekend
console.log('🎌 Is holiday/weekend:', isHoliday ? 'Yes' : 'No');

console.log('✅ JST timezone test completed!');
console.log('');
console.log('📋 Expected results:');
console.log('- Timezone should be: Asia/Tokyo');
console.log('- JST time should be UTC+9');
console.log('- Business hours: 9 AM - 6 PM JST');
console.log('- Date format should be Japanese style');
