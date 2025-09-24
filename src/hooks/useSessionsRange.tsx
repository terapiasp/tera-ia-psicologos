import { useState, useEffect, useMemo } from 'react';
import { useSessionsCache } from '@/contexts/SessionsCacheContext';
import { Session } from './useSessions';
import { startOfDay, endOfDay } from 'date-fns';

export const useSessionsRange = (startDate?: Date, endDate?: Date) => {
  const { getSessionsForRange, isMonthLoading } = useSessionsCache();
  const [sessions, setSessions] = useState<Session[]>([]);

  // Memoizar os filtros de data para evitar mudanças desnecessárias
  const dateFilters = useMemo(() => {
    if (!startDate || !endDate) return { start: null, end: null };
    
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
  }, [startDate, endDate]);

  const isLoading = useMemo(() => {
    if (!dateFilters.start || !dateFilters.end) return false;
    
    // Check if any of the months in the range are loading
    const current = new Date(dateFilters.start);
    current.setDate(1);
    
    while (current <= dateFilters.end) {
      if (isMonthLoading(current)) {
        return true;
      }
      current.setMonth(current.getMonth() + 1);
    }
    
    return false;
  }, [dateFilters.start, dateFilters.end, isMonthLoading]);

  useEffect(() => {
    if (dateFilters.start && dateFilters.end) {
      const rangeSessions = getSessionsForRange(dateFilters.start, dateFilters.end);
      setSessions(rangeSessions);
    } else {
      setSessions([]);
    }
  }, [dateFilters, getSessionsForRange]);

  return {
    sessions,
    isLoading,
    error: null // Cache context handles errors internally
  };
};