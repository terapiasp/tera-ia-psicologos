import { supabase } from '@/integrations/supabase/client';

/**
 * Força a regeneração de sessões para pacientes específicos que perderam suas sessões
 */
export async function forceRegenerateForPatients(patientIds: string[]) {
  console.log('🔧 Iniciando regeneração forçada para', patientIds.length, 'pacientes');
  
  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const patientId of patientIds) {
    try {
      console.log(`\n📋 Processando paciente: ${patientId}`);
      
      // Buscar a agenda ativa do paciente
      const { data: schedule, error: scheduleError } = await supabase
        .from('recurring_schedules')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .maybeSingle();

      if (scheduleError) {
        console.error('❌ Erro ao buscar schedule:', scheduleError);
        results.failed.push({ id: patientId, error: scheduleError.message });
        continue;
      }

      if (!schedule) {
        console.warn('⚠️  Nenhuma agenda ativa encontrada para este paciente');
        results.failed.push({ id: patientId, error: 'No active schedule found' });
        continue;
      }

      console.log('📅 Agenda encontrada:', schedule.id);
      console.log('📋 Regra:', schedule.rrule_json);

      // Deletar todas as sessões futuras recorrentes deste paciente
      const { data: deletedSessions, error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('schedule_id', schedule.id)
        .eq('origin', 'recurring')
        .gte('scheduled_at', new Date().toISOString())
        .select('id');

      if (deleteError) {
        console.error('❌ Erro ao deletar sessões:', deleteError);
        results.failed.push({ id: patientId, error: deleteError.message });
        continue;
      }

      console.log('🗑️  Sessões deletadas:', deletedSessions?.length ?? 0);

      // Gerar novas sessões
      const rule = schedule.rrule_json;
      const newSessions = generateSessionOccurrences(rule, 12);
      
      console.log('🔢 Novas sessões geradas:', newSessions.length);

      if (newSessions.length === 0) {
        console.warn('⚠️  Nenhuma sessão foi gerada para este paciente');
        results.failed.push({ id: patientId, error: 'No sessions generated' });
        continue;
      }

      // Inserir novas sessões
      const sessionsToInsert = newSessions.map(sessionDate => ({
        user_id: schedule.user_id,
        patient_id: schedule.patient_id,
        schedule_id: schedule.id,
        scheduled_at: sessionDate.toISOString(),
        duration_minutes: schedule.duration_minutes,
        type: 'therapy',
        modality: schedule.session_type,
        value: schedule.session_value,
        status: 'scheduled',
        paid: false,
        origin: 'recurring'
      }));

      const { error: insertError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert);

      if (insertError) {
        console.error('❌ Erro ao inserir sessões:', insertError);
        results.failed.push({ id: patientId, error: insertError.message });
        continue;
      }

      console.log('✅ Sessões inseridas com sucesso:', sessionsToInsert.length);
      results.success.push(patientId);

    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      results.failed.push({ id: patientId, error: error.message || 'Unknown error' });
    }
  }

  console.log('\n📊 Resultados da regeneração:');
  console.log('✅ Sucesso:', results.success.length);
  console.log('❌ Falhas:', results.failed.length);
  
  if (results.failed.length > 0) {
    console.log('Detalhes das falhas:', results.failed);
  }

  return results;
}

/**
 * Gera ocorrências de sessão baseado em uma regra de recorrência
 */
function generateSessionOccurrences(rule: any, monthsAhead: number): Date[] {
  const occurrences: Date[] = [];
  const startDate = new Date(rule.startDate);
  const [hours, minutes] = rule.startTime.split(':').map(Number);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  let currentDate = new Date(startDate);
  currentDate.setHours(hours, minutes, 0, 0);

  while (currentDate < endDate) {
    if (shouldIncludeDate(currentDate, rule)) {
      occurrences.push(new Date(currentDate));
    }

    currentDate = getNextCandidateDate(currentDate, rule);
  }

  return occurrences;
}

function shouldIncludeDate(date: Date, rule: any): boolean {
  const dayOfWeek = date.getDay();

  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return rule.daysOfWeek?.includes(dayOfWeek) || false;
    case 'biweekly':
      const startDate = new Date(rule.startDate);
      const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff % 2 === 0 && (rule.daysOfWeek?.includes(dayOfWeek) || false);
    case 'monthly':
      return date.getDate() === startDate.getDate();
    case 'custom':
      return rule.daysOfWeek?.includes(dayOfWeek) || false;
    default:
      return false;
  }
}

function getNextCandidateDate(currentDate: Date, rule: any): Date {
  const next = new Date(currentDate);
  
  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + (rule.interval || 1));
      break;
    case 'weekly':
    case 'biweekly':
      next.setDate(next.getDate() + 1);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + (rule.interval || 1));
      break;
    case 'custom':
      next.setDate(next.getDate() + (rule.interval || 1));
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}
