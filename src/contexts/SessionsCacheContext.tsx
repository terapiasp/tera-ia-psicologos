import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Session } from '@/hooks/useSessions';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface SessionsCache {
  [monthKey: string]: Session[];
}

interface SessionsCacheContextType {
  getSessionsForRange: (startDate: Date, endDate: Date) => Session[];
  prefetchMonth: (date: Date) => void;
  isMonthLoading: (date: Date) => boolean;
  clearCache: () => void;
}

const SessionsCacheContext = createContext<SessionsCacheContextType | undefined>(undefined);

export const useSessionsCache = () => {
  const context = useContext(SessionsCacheContext);
  if (!context) {
    throw new Error('useSessionsCache must be used within SessionsCacheProvider');
  }
  return context;
};

interface SessionsCacheProviderProps {
  children: ReactNode;
}

export const SessionsCacheProvider: React.FC<SessionsCacheProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<SessionsCache>({});
  const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());

  // Limpar cache quando mudança de usuário
  React.useEffect(() => {
    setCache({});
    setLoadingMonths(new Set());
  }, [user?.id]);

  const getMonthKey = useCallback((date: Date) => {
    return format(date, 'yyyy-MM');
  }, []);

  const fetchMonthData = useCallback(async (date: Date): Promise<Session[]> => {
    if (!user?.id) return [];

    const monthKey = getMonthKey(date);
    setLoadingMonths(prev => new Set(prev).add(monthKey));

    try {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          patients!inner (
            name,
            nickname,
            is_archived
          )
        `)
        .eq('user_id', user.id)
        .eq('patients.is_archived', false)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const normalizedData = (data || []).map(session => ({
        ...session,
        value: session.value ? Number(session.value) : undefined
      })) as Session[];

      setCache(prev => ({
        ...prev,
        [monthKey]: normalizedData
      }));

      return normalizedData;
    } catch (error) {
      console.error('Error fetching month data:', error);
      return [];
    } finally {
      setLoadingMonths(prev => {
        const newSet = new Set(prev);
        newSet.delete(monthKey);
        return newSet;
      });
    }
  }, [user?.id, getMonthKey]);

  const prefetchMonth = useCallback((date: Date) => {
    const monthKey = getMonthKey(date);
    if (!cache[monthKey] && !loadingMonths.has(monthKey)) {
      fetchMonthData(date);
    }
  }, [cache, loadingMonths, fetchMonthData, getMonthKey]);

  const getSessionsForRange = useCallback((startDate: Date, endDate: Date): Session[] => {
    const sessions: Session[] = [];
    const current = new Date(startDate);
    current.setDate(1); // Start from beginning of month

    // Get all months that overlap with the date range
    const monthsToLoad: Date[] = [];
    while (current <= endDate) {
      monthsToLoad.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    // Collect sessions from cache and trigger loads for missing months
    for (const monthDate of monthsToLoad) {
      const monthKey = getMonthKey(monthDate);
      
      if (cache[monthKey]) {
        // Filter sessions for the actual requested range
        const monthSessions = cache[monthKey].filter(session => {
          const sessionDate = new Date(session.scheduled_at);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
        sessions.push(...monthSessions);
      } else if (!loadingMonths.has(monthKey)) {
        // Trigger fetch for missing month
        fetchMonthData(monthDate);
      }
    }

    // Prefetch adjacent months for smoother navigation
    const prevMonth = new Date(monthsToLoad[0]);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    prefetchMonth(prevMonth);

    const nextMonth = new Date(monthsToLoad[monthsToLoad.length - 1]);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    prefetchMonth(nextMonth);

    return sessions.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [cache, loadingMonths, fetchMonthData, prefetchMonth, getMonthKey]);

  const isMonthLoading = useCallback((date: Date): boolean => {
    const monthKey = getMonthKey(date);
    return loadingMonths.has(monthKey);
  }, [loadingMonths, getMonthKey]);

  const clearCache = useCallback(() => {
    setCache({});
    setLoadingMonths(new Set());
  }, []);

  return (
    <SessionsCacheContext.Provider value={{
      getSessionsForRange,
      prefetchMonth,
      isMonthLoading,
      clearCache
    }}>
      {children}
    </SessionsCacheContext.Provider>
  );
};