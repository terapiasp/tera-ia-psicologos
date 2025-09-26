import { supabase } from '@/integrations/supabase/client';

// Função para forçar regeneração de sessões dos pacientes problemáticos
export const forceFixRecurringSessions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Usuário não autenticado');

  console.log('Iniciando correção de sessões recorrentes...');

  // Pacientes específicos com problemas: Dan, Jean, Nereu
  const problematicSchedules = [
    '247e5cc5-e171-4c8a-944c-7746af3487a4', // Dan
    'e4836d01-7001-4723-8362-9be3601fe63e', // Jean
    '1422b436-b58f-4f6e-a6f5-1fcfecef6384', // Nereu
  ];

  for (const scheduleId of problematicSchedules) {
    try {
      console.log(`Regenerando sessões para schedule: ${scheduleId}`);

      // Buscar dados do schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('recurring_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .single();

      if (scheduleError) {
        console.error(`Erro ao buscar schedule ${scheduleId}:`, scheduleError);
        continue;
      }

      if (!schedule) {
        console.log(`Schedule ${scheduleId} não encontrado`);
        continue;
      }

      // Deletar sessões futuras existentes
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('schedule_id', scheduleId)
        .eq('origin', 'recurring')
        .gte('scheduled_at', new Date().toISOString());

      if (deleteError) {
        console.error(`Erro ao deletar sessões de ${scheduleId}:`, deleteError);
        continue;
      }

      // Gerar novas sessões usando a lógica corrigida
      const rule = schedule.rrule_json;
      const sessions = generateSessionOccurrences(rule, 12);

      console.log(`Gerando ${sessions.length} sessões para ${scheduleId}`);

      // Inserir novas sessões
      const sessionsToInsert = sessions.map(sessionDate => ({
        user_id: user.id,
        patient_id: schedule.patient_id,
        schedule_id: schedule.id,
        scheduled_at: sessionDate.toISOString(),
        duration_minutes: schedule.duration_minutes,
        type: 'therapy',
        modality: schedule.session_type,
        value: schedule.session_value ? Number(schedule.session_value) : undefined,
        status: 'scheduled',
        paid: false,
        origin: 'recurring'
      }));

      if (sessionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('sessions')
          .insert(sessionsToInsert);

        if (insertError) {
          console.error(`Erro ao inserir sessões de ${scheduleId}:`, insertError);
        } else {
          console.log(`✅ ${sessionsToInsert.length} sessões inseridas para ${scheduleId}`);
        }
      }

    } catch (error) {
      console.error(`Erro ao processar schedule ${scheduleId}:`, error);
    }
  }

  console.log('Correção finalizada!');
};

// Função auxiliar para gerar ocorrências
const generateSessionOccurrences = (rule: any, monthsAhead: number): Date[] => {
  const { addMonths, parseISO, setHours, setMinutes, isBefore, addDays } = require('date-fns');
  
  const occurrences: Date[] = [];
  const startDate = parseISO(rule.startDate);
  const [hours, minutes] = rule.startTime.split(':').map(Number);
  const endDate = addMonths(new Date(), monthsAhead);

  let currentDate = setMinutes(setHours(startDate, hours), minutes);

  // Se a data de início já passou, começar da próxima ocorrência válida
  if (currentDate < new Date()) {
    currentDate = new Date();
    currentDate = setMinutes(setHours(currentDate, hours), minutes);
    
    // Se o horário já passou hoje, começar amanhã
    if (currentDate < new Date()) {
      currentDate = addDays(currentDate, 1);
    }
  }

  while (isBefore(currentDate, endDate)) {
    if (shouldIncludeDate(currentDate, rule)) {
      occurrences.push(new Date(currentDate));
    }

    currentDate = getNextCandidateDate(currentDate, rule);
  }

  return occurrences;
};

// Funções auxiliares
const shouldIncludeDate = (date: Date, rule: any): boolean => {
  const dayOfWeek = date.getDay();

  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return rule.daysOfWeek?.includes(dayOfWeek) || false;
    case 'biweekly':
      const { parseISO } = require('date-fns');
      const startDate = parseISO(rule.startDate);
      const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff % 2 === 0 && (rule.daysOfWeek?.includes(dayOfWeek) || false);
    case 'monthly':
      return date.getDate() === startDate.getDate();
    case 'custom':
      return rule.daysOfWeek?.includes(dayOfWeek) || false;
    default:
      return false;
  }
};

const getNextCandidateDate = (currentDate: Date, rule: any): Date => {
  const { addDays, addMonths } = require('date-fns');
  
  switch (rule.frequency) {
    case 'daily':
      return addDays(currentDate, rule.interval || 1);
    case 'weekly':
    case 'biweekly':
      return addDays(currentDate, 1);
    case 'monthly':
      return addMonths(currentDate, rule.interval || 1);
    case 'custom':
      return addDays(currentDate, rule.interval || 1);
    default:
      return addDays(currentDate, 1);
  }
};