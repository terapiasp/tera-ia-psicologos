import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { addMonths, parseISO, startOfDay, addDays, addWeeks, setHours, setMinutes, isBefore } from 'date-fns';
import { useMemo } from 'react';

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
  session_type: string; // Agora será usado como modality
  session_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringScheduleData {
  patient_id: string;
  rrule_json: RecurrenceRule;
  duration_minutes: number;
  session_type: string; // Agora será usado como modality
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
        rrule_json: item.rrule_json as unknown as RecurrenceRule
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
        rrule_json: newSchedule.rrule_json as unknown as RecurrenceRule
      });
      
      // Invalidar TODAS as queries de sessions - isso é crítico para atualizar o dashboard
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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
    onSuccess: async (updatedSchedule) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      
      // Regenerar sessões futuras
      await regenerateFutureSessionsForSchedule({
        ...updatedSchedule,
        rrule_json: updatedSchedule.rrule_json as unknown as RecurrenceRule
      });
      
      // Forçar invalidação completa do cache de sessões
      queryClient.removeQueries({ queryKey: ['sessions'] });
      queryClient.removeQueries({ queryKey: ['today-sessions'] });
      queryClient.removeQueries({ queryKey: ['tomorrow-sessions'] });
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

    console.log('Materializando sessões para schedule:', schedule.id);

    const rule = schedule.rrule_json;
    const sessions = generateSessionOccurrences(rule, 12); // 12 meses à frente
    
    console.log('Sessões geradas:', sessions.length, sessions.slice(0, 3));

    // Verificar quais sessões já existem para evitar duplicatas
    // Usar tanto schedule_id quanto patient_id para garantir unicidade
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('scheduled_at')
      .eq('patient_id', schedule.patient_id)
      .gte('scheduled_at', new Date().toISOString());

    const existingDates = new Set(
      existingSessions?.map(s => new Date(s.scheduled_at).toISOString()) || []
    );

    // Filtrar apenas sessões que não existem
    const newSessions = sessions.filter(sessionDate => 
      !existingDates.has(sessionDate.toISOString())
    );

    console.log('Sessões novas a inserir:', newSessions.length, 'de', sessions.length, 'totais');

    if (newSessions.length === 0) {
      console.log('Nenhuma sessão nova para inserir');
      return;
    }

    // Inserir apenas sessões novas
    const sessionsToInsert = newSessions.map(sessionDate => ({
      user_id: user.id,
      patient_id: schedule.patient_id,
      schedule_id: schedule.id,
      scheduled_at: sessionDate.toISOString(),
      duration_minutes: schedule.duration_minutes,
      type: 'therapy', // Sempre therapy agora
      modality: schedule.session_type, // session_type vira modalidade
      value: schedule.session_value ? Number(schedule.session_value) : undefined, // Garantir que seja número
      status: 'scheduled',
      paid: false,
      origin: 'recurring'
    }));

    try {
      console.log('Inserindo', sessionsToInsert.length, 'sessões novas no banco');
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionsToInsert);

      if (error) {
        // Se o erro for de duplicação, silenciar (sessões já existem)
        if (error.code === '23505') {
          console.log('Sessões já existem no banco (constraint violation), continuando...');
        } else {
          console.error('Erro ao materializar sessões:', error);
          throw error;
        }
      } else {
        console.log('Sessões inseridas com sucesso:', (data as any)?.length ?? sessionsToInsert.length);
      }
      
      // Invalidar queries para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (error: any) {
      // Silenciar erros de duplicação (23505)
      if (error?.code !== '23505') {
        console.error('Erro ao inserir sessões:', error);
        throw error;
      }
    }
  };

  // Função para regenerar sessões futuras quando uma regra é alterada
  const regenerateFutureSessionsForSchedule = async (schedule: RecurringSchedule, options?: { cutoff?: Date }) => {
    if (!user?.id) return;

    console.log('Regenerando sessões futuras para schedule:', schedule.id);

    // Deletar sessões futuras existentes desta recorrência
    const cutoffDate = options?.cutoff || new Date();
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('schedule_id', schedule.id)
      .eq('origin', 'recurring')
      .gte('scheduled_at', cutoffDate.toISOString())
      .select('id');

    if (deleteError) {
      console.error('Erro ao deletar sessões futuras:', deleteError);
      throw deleteError;
    }

    console.log('Sessões deletadas:', deletedSessions?.length ?? 0);

    // Regenerar sessões
    await materializeSessionsForSchedule(schedule);
    
    console.log('Sessões regeneradas com sucesso');
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

  // Método para atualizar série a partir de uma ocorrência
  const updateSeriesFromOccurrence = async (scheduleId: string, occurrenceDateTime: Date, targetDateTime: Date) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) throw new Error('Schedule não encontrado');

    const rule = schedule.rrule_json;
    const targetDay = targetDateTime.getDay();
    const targetHours = targetDateTime.getHours();
    const targetMinutes = targetDateTime.getMinutes();

    let newRule: RecurrenceRule;

    switch (rule.frequency) {
      case 'weekly':
      case 'biweekly':
        newRule = {
          ...rule,
          daysOfWeek: [targetDay],
          startTime: `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}`,
          startDate: targetDateTime.toISOString().split('T')[0]
        };
        break;
      case 'monthly':
        newRule = {
          ...rule,
          startTime: `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}`,
          startDate: targetDateTime.toISOString().split('T')[0]
        };
        break;
      default:
        // Custom/outros: fallback para weekly
        newRule = {
          ...rule,
          frequency: 'weekly',
          daysOfWeek: [targetDay],
          startTime: `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}`,
          startDate: targetDateTime.toISOString().split('T')[0]
        };
        toast({
          title: "Recorrência convertida",
          description: "Recorrência personalizada foi convertida para semanal",
        });
    }

    const { data, error } = await supabase
      .from('recurring_schedules')
      .update({ rrule_json: newRule as any })
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    await regenerateFutureSessionsForSchedule({
      ...data,
      rrule_json: data.rrule_json as unknown as RecurrenceRule
    }, { cutoff: occurrenceDateTime });

    queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });

    return data;
  };

  // Método para mover apenas uma ocorrência
  const moveSingleOccurrence = async (sessionId: string, scheduleId: string, occurrenceDate: Date, targetDateTime: Date) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    // Atualizar a sessão
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        scheduled_at: targetDateTime.toISOString(),
        origin: 'manual' // Marcar como movida manualmente
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (sessionError) throw sessionError;

    // Registrar exceção
    const { error: exceptionError } = await supabase
      .from('recurring_exceptions')
      .insert({
        user_id: user.id,
        schedule_id: scheduleId,
        exception_date: occurrenceDate.toISOString().split('T')[0],
        exception_type: 'move',
        new_datetime: targetDateTime.toISOString()
      });

    if (exceptionError) throw exceptionError;

    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  };

  // Função para forçar regeneração de sessões para um paciente específico
  const forceRegeneratePatientSessions = async (patientId: string) => {
    if (!user?.id) return;

    console.log('Forçando regeneração de sessões para paciente:', patientId);

    // Buscar schedule ativo do paciente
    const schedule = schedules.find(s => s.patient_id === patientId && s.is_active);
    if (!schedule) {
      throw new Error('Nenhum agendamento recorrente ativo encontrado para este paciente');
    }

    // Regenerar sessões
    await regenerateFutureSessionsForSchedule(schedule);
    
    toast({
      title: "Sessões regeneradas",
      description: "Sessões futuras foram regeneradas com sucesso!",
    });
  };

  // Função para verificar integridade e detectar pacientes com problemas
  const checkIntegrityAndFix = async () => {
    if (!user?.id) return;

    console.log('Verificando integridade das sessões recorrentes...');

    // Buscar pacientes ativos com recorrência mas sem sessões futuras
    const { data: problematicPatients, error } = await supabase
      .rpc('get_patients_with_missing_sessions', { target_user_id: user.id });

    if (error) {
      console.error('Erro ao verificar integridade:', error);
      return;
    }

    if (problematicPatients?.length > 0) {
      console.log('Pacientes com problemas encontrados:', problematicPatients);
      
      // Tentar regenerar para cada paciente problemático
      for (const patient of problematicPatients) {
        try {
          await forceRegeneratePatientSessions(patient.patient_id);
        } catch (error) {
          console.error(`Erro ao regenerar sessões para paciente ${patient.patient_id}:`, error);
        }
      }
      
      toast({
        title: "Verificação de integridade",
        description: `Regeneradas sessões para ${problematicPatients.length} paciente(s)`,
      });
    } else {
      toast({
        title: "Integridade OK",
        description: "Todos os pacientes ativos têm sessões futuras configuradas",
      });
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
    updateSeriesFromOccurrence,
    moveSingleOccurrence,
    forceRegeneratePatientSessions,
    checkIntegrityAndFix,
  };
};
