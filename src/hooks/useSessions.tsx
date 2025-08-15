import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { startOfDay, endOfDay } from 'date-fns';
import { useMemo } from 'react';

export interface Session {
  id: string;
  user_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  value?: number;
  paid: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  patients?: {
    name: string;
    nickname?: string;
  };
}

export interface CreateSessionData {
  patient_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  type: string;
  value?: number;
  notes?: string;
}

export const useSessions = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Memoizar os filtros de data para evitar mudanças desnecessárias
  const dateFilters = useMemo(() => {
    if (!startDate || !endDate) return { startISO: null, endISO: null };
    
    return {
      startISO: startOfDay(startDate).toISOString(),
      endISO: endOfDay(endDate).toISOString()
    };
  }, [startDate, endDate]);

  const queryKey = ['sessions', dateFilters.startISO || 'none', dateFilters.endISO || 'none'];

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      let query = supabase
        .from('sessions')
        .select(`
          *,
          patients (
            name,
            nickname
          )
        `)
        .eq('user_id', user.id);

      if (dateFilters.startISO && dateFilters.endISO) {
        query = query
          .gte('scheduled_at', dateFilters.startISO)
          .lte('scheduled_at', dateFilters.endISO);
      }

      const { data, error } = await query.order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Sessions query error:', error);
        throw error;
      }
      
      return data as Session[] || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
    refetchOnWindowFocus: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: CreateSessionData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...sessionData,
          user_id: user.id,
          status: 'scheduled',
          duration_minutes: sessionData.duration_minutes || 50,
          paid: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Sessão agendada",
        description: "Nova sessão criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar sessão",
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Sessão atualizada",
        description: "Informações atualizadas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar sessão",
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    createSession: createSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
  };
};

// Hook especializado para sessions de hoje
export const useTodaySessions = () => {
  const today = useMemo(() => new Date(), []);
  return useSessions(today, today);
};

// Hook especializado para sessions de amanhã
export const useTomorrowSessions = () => {
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  return useSessions(tomorrow, tomorrow);
};