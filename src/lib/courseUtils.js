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

export function getTopicForDay(topics, dayNumber) {
  // Sort topics by week and day, then match by sequential day number
  const sorted = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  // Find the topic whose cumulative position matches the day number
  // Each topic corresponds to a sequential day
  let cumDay = 0;
  for (const topic of sorted) {
    cumDay++;
    if (cumDay === dayNumber) return topic;
  }
  return null;
}

export function getCompletionPercentage(totalTopics, completedTopics) {
  if (!totalTopics) return 0;
  return Math.round((completedTopics / totalTopics) * 100);
}