import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from './useSessions';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

interface UseInfiniteSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  lastElementRef: (node: HTMLElement | null) => void;
  deleteSession: (id: string) => Promise<void>;
}

const INITIAL_DAYS = 30;
const LOAD_MORE_DAYS = 30;

export const useInfiniteSessions = (): UseInfiniteSessionsReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedUntil, setLoadedUntil] = useState<Date | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchSessions = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          patients!inner(name, nickname, is_archived)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('patients.is_archived', false)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    const startDate = startOfDay(new Date());
    const endDate = endOfDay(addDays(startDate, INITIAL_DAYS));
    
    const newSessions = await fetchSessions(startDate, endDate);
    
    setSessions(newSessions);
    setLoadedUntil(endDate);
    setIsLoading(false);
  }, [fetchSessions]);

  const loadMore = useCallback(async () => {
    if (!loadedUntil || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const startDate = addDays(loadedUntil, 1);
    const endDate = endOfDay(addDays(startDate, LOAD_MORE_DAYS));
    
    const newSessions = await fetchSessions(startDate, endDate);
    
    // Se não trouxe mais sessões por um período longo, pode parar de carregar
    const currentDate = new Date();
    const monthsAhead = (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (newSessions.length === 0 && monthsAhead > 12) {
      setHasMore(false);
    }
    
    setSessions(prev => [...prev, ...newSessions]);
    setLoadedUntil(endDate);
    setIsLoadingMore(false);
  }, [loadedUntil, isLoadingMore, fetchSessions]);

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      rootMargin: '100px' // Carregar quando estiver a 100px do fim
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMore]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    sessions,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    lastElementRef,
    deleteSession
  };
};