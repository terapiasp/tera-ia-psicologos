import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, startOfWeek, addDays, addHours, setHours, setMinutes, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSessions } from '@/hooks/useSessions';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';
import { SessionCard } from './SessionCard';
import { TimeSlot } from './TimeSlot';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { Session } from '@/hooks/useSessions';

interface SchedulerBoardProps {
  weekStart: Date;
}

export const SchedulerBoard: React.FC<SchedulerBoardProps> = ({ weekStart }) => {
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

  // Gerar horários de 7h às 21h de hora em hora
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const baseDate = startOfDay(new Date());
    
    for (let hour = 7; hour <= 21; hour++) {
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

  return (
    <div className="p-2">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 gap-1 mb-2 sticky top-0 bg-background z-10 border-b pb-2">
          <div className="text-xs font-medium text-muted-foreground py-1"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center py-1">
              <div className="text-xs font-medium">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(day, 'dd/MM')}
              </div>
            </div>
          ))}
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-8 gap-1 text-xs">
          {timeSlots.map((time) => (
            <React.Fragment key={time.toISOString()}>
              {/* Coluna de horários */}
              <div className="text-xs text-muted-foreground font-mono py-1 px-1 text-right border-r border-border/30">
                {format(time, 'HH:mm')}
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
            <Card className="opacity-90 rotate-3 shadow-lg">
              <CardContent className="p-2">
                <div className="text-sm font-medium">
                  {activeSession.patients?.nickname || activeSession.patients?.name}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activeSession.modality}
                </Badge>
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