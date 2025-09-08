import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, startOfWeek, addDays, addHours, setHours, setMinutes, startOfDay, isSameDay, addWeeks, subWeeks, addMinutes, startOfMonth, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';
import { usePatients } from '@/hooks/usePatients';
import { useIsCompact } from '@/hooks/useIsCompact';
import { DayColumn } from './DayColumn';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { MobileWeekDots } from './MobileWeekDots';
import { Session } from '@/hooks/useSessions';

interface SchedulerBoardProps {
  weekStart: Date;
  onWeekChange: (week: Date) => void;
  showWeekends?: boolean;
}

export const SchedulerBoard: React.FC<SchedulerBoardProps> = ({ weekStart, onWeekChange, showWeekends = true }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [actionContext, setActionContext] = useState<'view' | 'move'>('view');
  const [moveData, setMoveData] = useState<{
    session: Session;
    targetDateTime: Date;
  } | null>(null);

  const isCompact = useIsCompact();
  const weekEnd = addDays(weekStart, 6);
  const { sessions } = useSessions(weekStart, weekEnd);
  const { updateSeriesFromOccurrence, moveSingleOccurrence } = useRecurringSchedules();
  const { moveSession, deleteSession } = useSessions();
  const { patients } = usePatients();

  // Horários de início e fim
  const startHour = 6;
  const endHour = 22;
  
  // Gerar horários para labels
  const timeLabels = useMemo(() => {
    const labels: Date[] = [];
    const baseDate = startOfDay(new Date());
    
    for (let hour = startHour; hour <= endHour; hour++) {
      labels.push(setHours(baseDate, hour));
    }
    return labels;
  }, []);

  // Gerar dias da semana
  const weekDays = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    if (!showWeekends) {
      // Filtrar sábado (6) e domingo (0)
      return allDays.filter(day => day.getDay() !== 0 && day.getDay() !== 6);
    }
    return allDays;
  }, [weekStart, showWeekends]);

  // Calcular a semana do mês para border animado
  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = startOfMonth(date);
    const firstWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    
    const diffInWeeks = Math.floor((currentWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(5, diffInWeeks + 1));
  };

  const weekOfMonth = getWeekOfMonth(weekStart);
  
  // Estilos de border únicos para cada semana - todas com border-double
  const weekBorderStyles = {
    1: 'border-4 border-blue-600/70 shadow-lg shadow-blue-600/25 bg-gradient-to-br from-blue-50/30 to-transparent border-double',
    2: 'border-4 border-emerald-600/70 shadow-lg shadow-emerald-600/25 bg-gradient-to-br from-emerald-50/30 to-transparent border-double',
    3: 'border-4 border-purple-600/70 shadow-lg shadow-purple-600/25 bg-gradient-to-br from-purple-50/30 to-transparent border-double',
    4: 'border-4 border-amber-600/70 shadow-lg shadow-amber-600/25 bg-gradient-to-br from-amber-50/30 to-transparent border-double',
    5: 'border-4 border-red-600/70 shadow-lg shadow-red-600/25 bg-gradient-to-br from-red-50/30 to-transparent border-double'
  };

  const currentBorderStyle = weekBorderStyles[weekOfMonth as keyof typeof weekBorderStyles];

  const handleDragStart = (event: DragStartEvent) => {
    const session = sessions.find(s => s.id === event.active.id);
    setActiveSession(session || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSession(null);
    
    if (!event.over) return;

    const sessionId = event.active.id as string;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const dropData = event.over.data.current;
    if (!dropData?.date) return;

    let targetDateTime: Date;

    if (dropData.type === 'hour') {
      // Dropped on hour slot - usar o horário exato
      targetDateTime = new Date(dropData.time);
    } else if (dropData.type === 'day') {
      // Dropped on day column - calculate time based on mouse position
      const rect = event.over.rect;
      const dropY = event.delta.y + rect.top;
      const relativeY = dropY - rect.top;
      
      // Calculate target time based on position
      const minutesFromTop = Math.max(0, relativeY / (60 / 60)); // 60px per hour
      const targetMinutes = Math.round(minutesFromTop / 15) * 15; // Snap to 15-minute intervals
      
      targetDateTime = new Date(dropData.date);
      targetDateTime.setHours(startHour, 0, 0, 0);
      targetDateTime.setMinutes(targetDateTime.getMinutes() + targetMinutes);
    } else {
      // Fallback to time-based drop
      targetDateTime = new Date(dropData.date);
      if (dropData.time) {
        targetDateTime.setHours(dropData.time.getHours(), dropData.time.getMinutes());
      }
    }

    // Verificar se o evento realmente mudou de posição
    const originalDateTime = new Date(session.scheduled_at);
    const isSameDateTime = 
      originalDateTime.getFullYear() === targetDateTime.getFullYear() &&
      originalDateTime.getMonth() === targetDateTime.getMonth() &&
      originalDateTime.getDate() === targetDateTime.getDate() &&
      originalDateTime.getHours() === targetDateTime.getHours() &&
      originalDateTime.getMinutes() === targetDateTime.getMinutes();

    if (isSameDateTime) {
      // Não foi movido, apenas clicado - tratar como clique
      setActionContext('view');
    } else {
      // Foi realmente movido
      setActionContext('move');
    }
    
    setMoveData({ session, targetDateTime });
    setShowMoveDialog(true);
  };

  const handleSessionClick = (session: Session) => {
    setActionContext('view');
    setMoveData({ session, targetDateTime: new Date(session.scheduled_at) });
    setShowMoveDialog(true);
  };

  const handleMoveConfirm = async (moveType: 'single' | 'series') => {
    if (!moveData) return;

    const { session, targetDateTime } = moveData;

    try {
      if (session.schedule_id && moveType === 'series') {
        const originalDateTime = new Date(session.scheduled_at);
        await updateSeriesFromOccurrence(session.schedule_id, originalDateTime, targetDateTime);
      } else if (session.schedule_id && moveType === 'single') {
        const originalDateTime = new Date(session.scheduled_at);
        const occurrenceDate = startOfDay(originalDateTime);
        await moveSingleOccurrence(session.id, session.schedule_id, occurrenceDate, targetDateTime);
      } else {
        // Sessão não recorrente
        await moveSession({ sessionId: session.id, targetDateTime });
      }
    } catch (error) {
      console.error('Erro ao mover sessão:', error);
    } finally {
      setShowMoveDialog(false);
      setMoveData(null);
    }
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      return isSameDay(sessionDate, day);
    });
  };

  const hasSessionsForTime = (time: Date) => {
    return weekDays.some(day => {
      const daySessions = getSessionsForDay(day);
      return daySessions.some(session => {
        const sessionStart = new Date(session.scheduled_at);
        const sessionEnd = addMinutes(sessionStart, session.duration_minutes || 50);
        const hourStart = new Date(day);
        hourStart.setHours(time.getHours(), 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);
        
        return sessionStart < hourEnd && sessionEnd > hourStart;
      });
    });
  };

  const goToPreviousWeek = () => {
    onWeekChange(subWeeks(weekStart, 1));
  };

  const goToNextWeek = () => {
    onWeekChange(addWeeks(weekStart, 1));
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  // Renderizar versão compacta para mobile/tablet
  if (isCompact) {
    return (
      <div className="p-2">
        <MobileWeekDots 
          weekStart={weekStart} 
          sessions={sessions} 
          patients={patients}
          showWeekends={showWeekends}
        />
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl transition-all duration-500 ease-in-out animate-fade-in ${currentBorderStyle}`}>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Header com dias da semana */}
        <div className={`grid gap-1 mb-4 sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b pb-2 rounded-lg`}
             style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
          <div className="py-2" /> {/* Espaço vazio para coluna de horários */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center py-2">
              <div className="text-sm font-semibold text-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {format(day, 'dd/MM')}
              </div>
              {day === weekStart && (
                <div className="text-xs font-medium mt-1 px-2 py-1 rounded-full bg-primary/10 text-primary animate-pulse">
                  Semana {weekOfMonth}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Calendário principal */}
        <div className="flex">
          {/* Coluna de horários */}
          <div className="w-20 flex-shrink-0 border-r-2 border-primary/20">
            {timeLabels.map((time) => (
              <div 
                key={time.toISOString()} 
                className={`h-[60px] flex items-center justify-center text-sm font-semibold text-foreground transition-colors duration-200 ${
                  hasSessionsForTime(time) 
                    ? 'bg-orange-100 dark:bg-orange-950/30' 
                    : 'bg-success/10'
                }`}
              >
                <div className="bg-card rounded-lg px-2 py-1 shadow-soft border border-border/50">
                  {format(time, 'HH:mm')}
                </div>
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
            {weekDays.map((day) => {
              const daySessions = getSessionsForDay(day);
              
              return (
                <DayColumn
                  key={day.toISOString()}
                  date={day}
                  sessions={daySessions}
                  startHour={startHour}
                  endHour={endHour}
                  onSessionClick={handleSessionClick}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeSession && (
            <Card className="opacity-95 rotate-1 shadow-medium bg-gradient-soft border-primary/20">
              <CardContent className="p-3">
                <div className="text-sm font-semibold text-foreground">
                  {activeSession.patients?.nickname || activeSession.patients?.name}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-1">
                  {format(new Date(activeSession.scheduled_at), 'HH:mm')} - {format(addMinutes(new Date(activeSession.scheduled_at), 50), 'HH:mm')}
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <MoveConfirmationPopover
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        mode={actionContext}
        session={moveData?.session || null}
        patient={moveData?.session ? patients.find(p => p.id === moveData.session.patient_id) : null}
        onConfirm={handleMoveConfirm}
        onDelete={() => {
          if (!moveData?.session?.id) return;
          deleteSession(moveData.session.id);
          setShowMoveDialog(false);
          setMoveData(null);
        }}
      />
    </div>
  );
};