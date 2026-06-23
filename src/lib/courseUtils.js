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
  
  // Count unique week/day combinations from user progress
  const completedDayKeys = new Set();
  userProgress.forEach(p => {
    if (p.week_number && p.day_number) {
      completedDayKeys.add(`${p.week_number}-${p.day_number}`);
    }
  });
  
  return completedDayKeys.size + 1; // Next day after completed days
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
  // Sort topics by week and day
  const sorted = [...topics].sort((a, b) => {
    if (a.week_number !== b.week_number) return a.week_number - b.week_number;
    return a.day_number - b.day_number;
  });

  // Group topics by week and day
  const dayGroups = [];
  let currentWeek = null;
  let currentDay = null;
  let currentGroup = [];
  
  for (const topic of sorted) {
    if (topic.week_number !== currentWeek || topic.day_number !== currentDay) {
      if (currentGroup.length > 0) {
        dayGroups.push(currentGroup);
      }
      currentWeek = topic.week_number;
      currentDay = topic.day_number;
      currentGroup = [topic];
    } else {
      currentGroup.push(topic);
    }
  }
  
  if (currentGroup.length > 0) {
    dayGroups.push(currentGroup);
  }
  
  // Get the group at the specified day number
  const targetGroup = dayGroups[dayNumber - 1];
  return targetGroup || [];
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