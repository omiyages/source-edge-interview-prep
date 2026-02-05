# Japan Standard Time (JST) Configuration

## Overview
The website has been configured to use Japan Standard Time (JST) for all date/time operations. JST is UTC+9 and is the standard timezone for Japan.

## Files Created/Modified

### 1. Core Timezone Library (`src/lib/timezone.ts`)
**Features:**
- **JST Conversion Functions** - Convert between UTC and JST
- **Date Formatting** - Japanese locale formatting
- **Business Hours Detection** - Check if current time is business hours
- **Relative Time** - Japanese relative time display
- **React Hook** - `useJSTTimezone()` for components

**Key Functions:**
```typescript
// Get current JST time
timezoneUtils.now()

// Convert UTC to JST
timezoneUtils.utcToJST(utcDate)

// Format date in JST
timezoneUtils.formatJST(date, options)

// Check business hours (9 AM - 6 PM JST)
timezoneUtils.isBusinessHours()

// Get relative time in Japanese
timezoneUtils.getRelativeTime(date) // "2時間前"
```

### 2. JST DateTime Components (`src/components/JSTDateTime.tsx`)
**Components:**
- **`JSTDateTime`** - Display dates in JST with various formats
- **`JSTLiveClock`** - Live updating clock in JST
- **`JSTBusinessHours`** - Business hours indicator
- **`JSTDateRangePicker`** - Date picker with JST support

**Usage:**
```typescript
// Display date in JST
<JSTDateTime date={user.created_at} format="dateTime" />

// Live clock
<JSTLiveClock />

// Business hours indicator
<JSTBusinessHours />
```

### 3. Timezone Configuration (`src/config/timezone.ts`)
**Configuration:**
- **Timezone**: Asia/Tokyo (JST)
- **Locale**: ja-JP (Japanese)
- **Business Hours**: 9 AM - 6 PM JST, Monday-Friday
- **Japanese Holidays**: 2024-2025 holiday calendar
- **Date Formats**: Japanese date formatting options

### 4. Global App Configuration (`src/App.tsx`)
**Features:**
- **Automatic Timezone Detection** - Sets JST as default
- **Locale Configuration** - Japanese date formatting
- **Global Date Override** - All dates display in JST

## Updated Components

### Kanban Board (`src/components/KanbanBoard.tsx`)
- **Interview Dates** - Display in JST format
- **Last Updated** - Show in JST
- **User Activity** - All timestamps in JST

### User Detail Modal (`src/components/UserDetailModal.tsx`)
- **Activity Timeline** - All dates in JST
- **Interview Scheduling** - JST timezone
- **Notes & Tasks** - Timestamps in JST

## Date Format Examples

### Japanese Date Formats
- **Short**: 2024/01/15
- **Long**: 2024年1月15日
- **Time**: 14:30
- **DateTime**: 2024/01/15 14:30
- **Full**: 2024年1月15日 14時30分

### Relative Time (Japanese)
- **Just now**: たった今
- **Minutes ago**: 5分前
- **Hours ago**: 2時間前
- **Days ago**: 3日前

## Business Hours

### JST Business Hours
- **Monday - Friday**: 9:00 AM - 6:00 PM JST
- **Weekends**: Closed
- **Holidays**: Japanese national holidays

### Business Day Detection
```typescript
// Check if current time is business hours
jstUtils.isBusinessHours() // true/false

// Check if date is a business day
jstUtils.isBusinessDay(date) // true/false

// Get next business day
jstUtils.getNextBusinessDay() // Date
```

## Japanese Holidays (2024-2025)

### 2024 Holidays
- New Year's Day (1/1)
- Coming of Age Day (1/8)
- National Foundation Day (2/11)
- Emperor's Birthday (2/23)
- Vernal Equinox Day (3/20)
- Showa Day (4/29)
- Constitution Memorial Day (5/3)
- Greenery Day (5/4)
- Children's Day (5/5)
- Marine Day (7/15)
- Mountain Day (8/11)
- Respect for the Aged Day (9/16)
- Autumnal Equinox Day (9/22)
- Sports Day (10/14)
- Culture Day (11/3)
- Labor Thanksgiving Day (11/23)
- Emperor's Birthday (12/23)

### 2025 Holidays
- Similar schedule with adjusted dates

## Implementation Examples

### 1. Display User Creation Date
```typescript
<JSTDateTime 
  date={user.created_at} 
  format="dateTime" 
  showTimezone={true} 
/>
// Output: 2024/01/15 14:30 (JST)
```

### 2. Show Relative Time
```typescript
<JSTDateTime 
  date={user.last_activity} 
  format="relative" 
/>
// Output: 2時間前
```

### 3. Business Hours Indicator
```typescript
<JSTBusinessHours />
// Output: 🟢 営業時間内 14:30
```

### 4. Live Clock
```typescript
<JSTLiveClock />
// Output: 2024/01/15 14:30 (JST)
```

## Database Considerations

### Storing Dates
- **Database**: Store in UTC (standard practice)
- **Display**: Convert to JST for user interface
- **API**: Send/receive in ISO format with timezone

### Supabase Integration
```typescript
// When saving dates, ensure they're in UTC
const utcDate = timezoneUtils.jstToUTC(jstDate);

// When displaying dates, convert to JST
const jstDate = timezoneUtils.utcToJST(utcDate);
```

## Testing JST Configuration

### 1. Verify Timezone
```javascript
// Check if timezone is set correctly
console.log(document.documentElement.getAttribute('data-timezone'));
// Should output: Asia/Tokyo
```

### 2. Test Date Formatting
```typescript
import { timezoneUtils } from '@/lib/timezone';

const now = new Date();
console.log(timezoneUtils.formatJST(now));
// Should output Japanese formatted date
```

### 3. Test Business Hours
```typescript
import { jstUtils } from '@/config/timezone';

console.log(jstUtils.isBusinessHours());
console.log(jstUtils.isBusinessDay(new Date()));
```

## Benefits

### User Experience
- ✅ **Consistent Timezone** - All dates in JST
- ✅ **Japanese Locale** - Proper date formatting
- ✅ **Business Hours** - Clear working hours indication
- ✅ **Holiday Awareness** - Japanese holiday calendar
- ✅ **Relative Time** - Japanese relative time display

### Developer Experience
- ✅ **Centralized Configuration** - Single timezone config
- ✅ **Reusable Components** - JST date components
- ✅ **Type Safety** - TypeScript support
- ✅ **Easy Integration** - Simple to use in components

## Migration Notes

### Existing Data
- **No Database Changes** - Existing UTC dates remain unchanged
- **Display Only** - JST conversion happens in UI
- **Backward Compatible** - Works with existing data

### Component Updates
- **Gradual Migration** - Update components as needed
- **Fallback Support** - Works with existing date displays
- **Performance** - Minimal impact on performance

## Files Summary

**New Files:**
- `src/lib/timezone.ts` - Core timezone utilities
- `src/components/JSTDateTime.tsx` - JST date components
- `src/config/timezone.ts` - Timezone configuration
- `JST_TIMEZONE_SETUP.md` - This guide

**Modified Files:**
- `src/App.tsx` - Global timezone initialization
- `src/components/KanbanBoard.tsx` - JST date display
- `src/components/UserDetailModal.tsx` - JST date formatting

**Result:**
- ✅ **All dates display in JST**
- ✅ **Japanese locale formatting**
- ✅ **Business hours detection**
- ✅ **Holiday calendar integration**
- ✅ **Consistent timezone across the application**
