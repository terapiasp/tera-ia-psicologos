import { addDays, addWeeks, addMonths, startOfMonth, endOfMonth, format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { RecurrenceRule } from '@/types/frequency';

export const generateOccurrencesInRange = (
  rule: RecurrenceRule,
  startDate: Date,
  endDate: Date
): Date[] => {
  const occurrences: Date[] = [];
  const ruleStartDate = parseISO(rule.startDate);
  const ruleStartTime = rule.startTime;
  
  // Parse the time and create a proper start datetime
  const [hours, minutes] = ruleStartTime.split(':').map(Number);
  let currentDate = new Date(ruleStartDate);
  currentDate.setHours(hours, minutes, 0, 0);
  
  // Start from the rule's start date or the range start date, whichever is later
  if (currentDate < startDate) {
    currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);
  }

  const maxIterations = 1000; // Safety limit
  let iterations = 0;

  while (currentDate <= endDate && iterations < maxIterations) {
    iterations++;

    if (shouldIncludeDate(currentDate, rule)) {
      occurrences.push(new Date(currentDate));
    }

    // Move to next candidate date
    currentDate = getNextCandidateDate(currentDate, rule);
  }

  return occurrences;
};

export const countNextMonth = (rule: RecurrenceRule): number => {
  const today = new Date();
  const currentMonth = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  // Calculate sessions per week based on rule
  const sessionsPerWeek = rule.daysOfWeek.length;
  
  if (rule.frequency === 'weekly') {
    // Weekly: sessions per week * 4 weeks
    return sessionsPerWeek * 4;
  } else if (rule.frequency === 'biweekly') {
    // Biweekly: sessions per week * 2 (every 2 weeks in a month)
    return sessionsPerWeek * 2;
  }
  
  // For custom or other frequencies, use the original calculation
  const occurrences = generateOccurrencesInRange(rule, currentMonth, currentMonthEnd);
  return occurrences.length;
};

const shouldIncludeDate = (date: Date, rule: RecurrenceRule): boolean => {
  const dayOfWeek = date.getDay();
  
  if (rule.frequency === 'weekly') {
    return rule.daysOfWeek.includes(dayOfWeek);
  } else if (rule.frequency === 'biweekly') {
    const ruleStartDate = parseISO(rule.startDate);
    const daysDiff = Math.floor((date.getTime() - ruleStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.floor(daysDiff / 7);
    
    return rule.daysOfWeek.includes(dayOfWeek) && weeksDiff % 2 === 0;
  } else if (rule.frequency === 'custom') {
    // For custom rules, implement based on the pattern
    return rule.daysOfWeek.includes(dayOfWeek);
  }
  
  return false;
};

const getNextCandidateDate = (currentDate: Date, rule: RecurrenceRule): Date => {
  if (rule.frequency === 'weekly') {
    return addDays(currentDate, 1);
  } else if (rule.frequency === 'biweekly') {
    return addDays(currentDate, 1);
  } else if (rule.frequency === 'custom') {
    return addDays(currentDate, 1);
  }
  
  return addDays(currentDate, 1);
};