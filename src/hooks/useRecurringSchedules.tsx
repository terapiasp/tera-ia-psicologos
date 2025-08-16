import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { addMonths, format, parse, startOfDay, addDays, addWeeks, setHours, setMinutes, isBefore, parseISO } from 'date-fns';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // Para custom: quantos dias/semanas entre sessões
  daysOfWeek?: number[]; // 0=domingo, 1=segunda, ..., 6=sábado
  startDate: string; // Data de início da recorrência
  startTime: string; // Horário da sessão (HH:mm)
}

export interface RecurringSchedule {
  id: string;
  user_id: string;
  patient_id: string;
  rrule_json: any; // JSON field from Supabase
  duration_minutes: number;
  session_type: 'individual' | 'couple' | 'group' | 'online';
  session_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringScheduleData {
  patient_id: string;
  rrule_json: RecurrenceRule;
  duration_minutes: number;
  session_type: 'individual' | 'couple' | 'group' | 'online';
  session_value?: number;
}

export const useRecurringSchedules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('recurring_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        rrule_json: item.rrule_json as unknown as RecurrenceRule,
        session_type: item.session_type as 'individual' | 'couple' | 'group' | 'online'
      })) as RecurringSchedule[];
    },
    enabled: !!user?.id,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: CreateRecurringScheduleData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('recurring_schedules')
        .insert({
          ...scheduleData,
          user_id: user.id,
          rrule_json: scheduleData.rrule_json as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      
      // Materializar sessões para os próximos 12 meses
      await materializeSessionsForSchedule({
        ...newSchedule,
        rrule_json: newSchedule.rrule_json as unknown as RecurrenceRule,
        session_type: newSchedule.session_type as 'individual' | 'couple' | 'group' | 'online'
      });
      
      // Invalidar todas as queries de sessions para atualizar o dashboard
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      
      toast({
        title: "Recorrência criada",
        description: "Agendamento recorrente configurado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar agendamento recorrente",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecurringSchedule> }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const updateData = updates.rrule_json 
        ? { ...updates, rrule_json: updates.rrule_json as any }
        : updates;

      const { data, error } = await supabase
        .from('recurring_schedules')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      // Regenerar sessões futuras
      regenerateFutureSessionsForSchedule({
        ...updatedSchedule,
        rrule_json: updatedSchedule.rrule_json as unknown as RecurrenceRule,
        session_type: updatedSchedule.session_type as 'individual' | 'couple' | 'group' | 'online'
      });
      toast({
        title: "Recorrência atualizada",
        description: "Agendamento recorrente atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar agendamento recorrente",
        variant: "destructive",
      });
    },
  });

  // Função para materializar sessões baseadas em uma regra de recorrência
  const materializeSessionsForSchedule = async (schedule: RecurringSchedule) => {
    if (!user?.id) return;

    const rule = schedule.rrule_json;
    const sessions = generateSessionOccurrences(rule, 12); // 12 meses à frente

    // Inserir sessões no banco de dados
    const sessionsToInsert = sessions.map(sessionDate => ({
      user_id: user.id,
      patient_id: schedule.patient_id,
      schedule_id: schedule.id,
      scheduled_at: sessionDate.toISOString(),
      duration_minutes: schedule.duration_minutes,
      type: 'individual', // Usar valor padrão válido para o constraint
      value: schedule.session_value,
      status: 'scheduled',
      origin: 'recurring'
    }));

    try {
      const { error } = await supabase
        .from('sessions')
        .insert(sessionsToInsert);

      if (error) {
        console.error('Erro ao materializar sessões:', error);
        throw error; // Propagar o erro para poder fazer o handling adequado
      }
    } catch (error) {
      console.error('Erro ao inserir sessões:', error);
    }
  };

  // Função para regenerar sessões futuras quando uma regra é alterada
  const regenerateFutureSessionsForSchedule = async (schedule: RecurringSchedule) => {
    if (!user?.id) return;

    // Deletar sessões futuras existentes desta recorrência
    const now = new Date();
    await supabase
      .from('sessions')
      .delete()
      .eq('schedule_id', schedule.id)
      .gte('scheduled_at', now.toISOString());

    // Regenerar sessões
    await materializeSessionsForSchedule(schedule);
    
    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  // Função para gerar ocorrências de sessões baseadas na regra
  const generateSessionOccurrences = (rule: RecurrenceRule, monthsAhead: number): Date[] => {
    const occurrences: Date[] = [];
    const startDate = parseISO(rule.startDate);
    const [hours, minutes] = rule.startTime.split(':').map(Number);
    const endDate = addMonths(new Date(), monthsAhead);

    let currentDate = setMinutes(setHours(startDate, hours), minutes);

    while (isBefore(currentDate, endDate)) {
      // Verificar se a data atende aos critérios da regra
      if (shouldIncludeDate(currentDate, rule)) {
        occurrences.push(new Date(currentDate));
      }

      // Avançar para a próxima data candidata
      currentDate = getNextCandidateDate(currentDate, rule);
    }

    return occurrences;
  };

  // Função para verificar se uma data deve ser incluída baseada na regra
  const shouldIncludeDate = (date: Date, rule: RecurrenceRule): boolean => {
    const dayOfWeek = date.getDay();

    switch (rule.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return rule.daysOfWeek?.includes(dayOfWeek) || false;
      case 'biweekly':
        // Verificar se está na semana correta (baseado na data de início)
        const startDate = parseISO(rule.startDate);
        const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff % 2 === 0 && (rule.daysOfWeek?.includes(dayOfWeek) || false);
      case 'monthly':
        // Mesmo dia do mês que a data de início
        return date.getDate() === startDate.getDate();
      case 'custom':
        // Lógica customizada baseada no intervalo
        return rule.daysOfWeek?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  };

  // Função para obter a próxima data candidata
  const getNextCandidateDate = (currentDate: Date, rule: RecurrenceRule): Date => {
    switch (rule.frequency) {
      case 'daily':
        return addDays(currentDate, rule.interval || 1);
      case 'weekly':
      case 'biweekly':
        return addDays(currentDate, 1); // Verificar dia por dia
      case 'monthly':
        return addMonths(currentDate, rule.interval || 1);
      case 'custom':
        return addDays(currentDate, rule.interval || 1);
      default:
        return addDays(currentDate, 1);
    }
  };

  return {
    schedules,
    isLoading,
    createSchedule: createScheduleMutation.mutate,
    updateSchedule: updateScheduleMutation.mutate,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    materializeSessionsForSchedule,
    regenerateFutureSessionsForSchedule,
  };
};