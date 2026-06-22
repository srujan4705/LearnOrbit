import { differenceInCalendarDays } from 'date-fns';

export function calculateCourseCurrentDay(courseStartDate) {
  const start = new Date(courseStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(today, start);
  return diff < 0 ? 0 : diff + 1; // Returns actual course day (same for all users)
}

export function calculateUserCurrentDay(userProgress) {
  if (!userProgress || userProgress.length === 0) {
    return 1; // New user starts at day 1
  }
  // Get the highest day number completed, then next day is current
  const maxDay = Math.max(...userProgress.map(p => p.day_number || 0));
  return maxDay + 1;
}

export function calculateUserDayFromEnrollment(enrollmentDate) {
  const enrolled = new Date(enrollmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  enrolled.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(today, enrolled);
  return diff < 0 ? 0 : diff + 1; // User's day 1 starts from enrollment date
}

export function isCourseStarted(courseStartDate) {
  const start = new Date(courseStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(today, start) >= 0;
}

export function getCurrentWeekAndDay(dayNumber) {
  const week = Math.ceil(dayNumber / 7);
  const day = ((dayNumber - 1) % 7) + 1;
  return { week, day };
}

export function getTopicsForDay(topics, dayNumber) {
  // Sort topics by week and day, then find all topics in the same week/day as the dayNumber
  const sorted = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  // First, find the week and day that corresponds to the sequential day number
  let cumDay = 0;
  let targetWeek = null;
  let targetDay = null;
  for (const topic of sorted) {
    cumDay++;
    if (cumDay === dayNumber) {
      targetWeek = topic.week_number;
      targetDay = topic.day_number;
      break;
    }
  }
  
  if (!targetWeek || !targetDay) return [];
  
  // Now return all topics with the same week and day
  return sorted.filter(t => t.week_number === targetWeek && t.day_number === targetDay);
}

// Keep getTopicForDay for backwards compatibility, returns first topic of the day
export function getTopicForDay(topics, dayNumber) {
  const topicsForDay = getTopicsForDay(topics, dayNumber);
  return topicsForDay[0] || null;
}

export function getCompletionPercentage(totalTopics, completedTopics) {
  if (!totalTopics) return 0;
  return Math.round((completedTopics / totalTopics) * 100);
}