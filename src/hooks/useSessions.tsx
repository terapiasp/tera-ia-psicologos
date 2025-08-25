
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
  schedule_id?: string; // ID da recorrência, se aplicável
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  modality?: string; // Nova propriedade para modalidade
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
  modality: string; // Mudou de type para modality
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
      
      console.log('Fetching sessions for date range:', dateFilters.startISO, 'to', dateFilters.endISO);
      
      let query = supabase
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
        .eq('patients.is_archived', false);

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
      
      console.log('Sessions fetched:', (data || []).length);
      
      // Garantir que value seja sempre número quando presente
      const normalizedData = (data || []).map(session => ({
        ...session,
        value: session.value ? Number(session.value) : undefined
      }));
      
      return normalizedData as Session[];
    },
    enabled: !!user?.id,
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: CreateSessionData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          patient_id: sessionData.patient_id,
          scheduled_at: sessionData.scheduled_at,
          duration_minutes: sessionData.duration_minutes || 50,
          type: 'therapy', // Sempre therapy
          modality: sessionData.modality, // Armazenar modalidade separadamente
          value: sessionData.value,
          notes: sessionData.notes,
          status: 'scheduled',
          paid: false,
          origin: 'manual'
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

  const moveSessionMutation = useMutation({
    mutationFn: async ({ sessionId, targetDateTime }: { sessionId: string; targetDateTime: Date }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sessions')
        .update({ scheduled_at: targetDateTime.toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Sessão movida",
        description: "Sessão reposicionada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao mover sessão",
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Sessão excluída',
        description: 'A sessão foi removida com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir sessão',
        variant: 'destructive',
      });
    },
  });
  
  return {
    sessions,
    isLoading,
    error,
    createSession: createSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    moveSession: moveSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    isMoving: moveSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
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
