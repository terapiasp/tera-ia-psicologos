import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, startOfWeek, addDays, addHours, setHours, setMinutes, startOfDay, isSameDay, addWeeks, subWeeks, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';
import { SessionCard } from './SessionCard';
import { TimeSlot } from './TimeSlot';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { Session } from '@/hooks/useSessions';

interface SchedulerBoardProps {
  weekStart: Date;
  onWeekChange: (week: Date) => void;
}

export const SchedulerBoard: React.FC<SchedulerBoardProps> = ({ weekStart, onWeekChange }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveData, setMoveData] = useState<{
    session: Session;
    targetDateTime: Date;
  } | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const { sessions } = useSessions(weekStart, weekEnd);
  const { updateSeriesFromOccurrence, moveSingleOccurrence } = useRecurringSchedules();
  const { moveSession } = useSessions();

  // Gerar horários de 6h às 22h de hora em hora
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const baseDate = startOfDay(new Date());
    
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(setHours(baseDate, hour));
    }
    return slots;
  }, []);

  // Gerar dias da semana
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

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
    if (!dropData?.date || !dropData?.time) return;

    const targetDateTime = new Date(dropData.date);
    targetDateTime.setHours(dropData.time.getHours(), dropData.time.getMinutes());

    setMoveData({ session, targetDateTime });
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

  const getSessionsForSlot = (day: Date, time: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      return isSameDay(sessionDate, day) && 
             sessionDate.getHours() === time.getHours();
    });
  };

  const hasSessionsForTime = (time: Date) => {
    return weekDays.some(day => getSessionsForSlot(day, time).length > 0);
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

  return (
    <div className="p-2">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 gap-1 mb-1 sticky top-0 bg-background z-10 border-b pb-2">
          <div className="flex items-center justify-center gap-1 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentWeek}
              className="h-7 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Hoje
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center py-2">
              <div className="text-sm font-semibold text-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {format(day, 'dd/MM')}
              </div>
            </div>
          ))}
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-8 gap-1 text-sm">
          {timeSlots.map((time) => (
            <React.Fragment key={time.toISOString()}>
              {/* Coluna de horários */}
              <div className={`text-base font-semibold text-foreground h-[38px] px-4 text-center border-r-2 border-primary/20 flex items-center justify-center min-w-[80px] transition-colors duration-200 ${
                hasSessionsForTime(time) 
                  ? 'bg-warning/10' 
                  : 'bg-success/10'
              }`}>
                <div className="bg-card rounded-lg px-3 py-1 shadow-soft border border-border/50">
                  {format(time, 'HH:mm')}
                </div>
              </div>
              
              {/* Slots para cada dia */}
              {weekDays.map((day) => {
                const slotSessions = getSessionsForSlot(day, time);
                
                return (
                  <TimeSlot
                    key={`${day.toISOString()}-${time.toISOString()}`}
                    date={day}
                    time={time}
                    sessions={slotSessions}
                  />
                );
              })}
            </React.Fragment>
          ))}
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
        session={moveData?.session || null}
        onConfirm={handleMoveConfirm}
      />
    </div>
  );
};