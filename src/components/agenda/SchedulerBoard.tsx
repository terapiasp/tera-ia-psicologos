import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, startOfWeek, addDays, addHours, setHours, setMinutes, startOfDay, isSameDay, addWeeks, subWeeks, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSessions } from '@/hooks/useSessions';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';
import { usePatients } from '@/hooks/usePatients';
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
  const [showWeekend, setShowWeekend] = useState(false);

  const isMobile = useIsMobile();
  const weekEnd = addDays(weekStart, 6);
  const { sessions } = useSessions(weekStart, weekEnd);
  const { updateSeriesFromOccurrence, moveSingleOccurrence } = useRecurringSchedules();
  const { moveSession, deleteSession } = useSessions();
  const { patients } = usePatients();

  // Gerar horários de 6h às 22h de hora em hora
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const baseDate = startOfDay(new Date());
    
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(setHours(baseDate, hour));
    }
    return slots;
  }, []);

  // Gerar dias da semana - mobile mostra apenas dias úteis por padrão
  const weekDays = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    if (isMobile && !showWeekend) {
      // Mostra apenas segunda a sexta no mobile
      return allDays.slice(0, 5);
    }
    
    return allDays;
  }, [weekStart, isMobile, showWeekend]);

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
    <div className={`${isMobile ? 'p-1' : 'p-2'}`}>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Botão para mostrar/ocultar fim de semana no mobile */}
        {isMobile && (
          <div className="flex justify-center mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWeekend(!showWeekend)}
              className="text-xs"
            >
              <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showWeekend ? 'rotate-180' : ''}`} />
              {showWeekend ? 'Ocultar fim de semana' : 'Mostrar fim de semana'}
            </Button>
          </div>
        )}

        {/* Container com scroll horizontal para mobile */}
        <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
          <div className={`${isMobile ? 'min-w-max' : ''}`}>
            {/* Header com dias da semana */}
            <div className={`grid gap-1 mb-1 sticky top-0 bg-background z-10 border-b pb-2 ${
              isMobile 
                ? showWeekend 
                  ? 'grid-cols-8' 
                  : 'grid-cols-6'
                : 'grid-cols-8'
            }`}>
              <div className={`flex items-center justify-center gap-1 py-2 ${isMobile ? 'min-w-[70px]' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className={`${isMobile ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'} hover:bg-primary hover:text-primary-foreground transition-colors`}
                >
                  <ChevronLeft className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                </Button>
                
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="h-7 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Hoje
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  className={`${isMobile ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'} hover:bg-primary hover:text-primary-foreground transition-colors`}
                >
                  <ChevronRight className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                </Button>
              </div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className={`text-center py-2 ${isMobile ? 'min-w-[70px]' : ''}`}>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>
                    {format(day, isMobile ? 'EEE' : 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid principal */}
            <div className={`grid gap-1 ${isMobile ? 'text-xs' : 'text-sm'} ${
              isMobile 
                ? showWeekend 
                  ? 'grid-cols-8' 
                  : 'grid-cols-6'
                : 'grid-cols-8'
            }`}>
              {timeSlots.map((time) => (
                <React.Fragment key={time.toISOString()}>
                  {/* Coluna de horários */}
                  <div className={`text-base font-semibold text-foreground ${isMobile ? 'h-[32px] px-2' : 'h-[38px] px-4'} text-center border-r-2 border-primary/20 flex items-center justify-center ${isMobile ? 'min-w-[70px]' : 'min-w-[80px]'} transition-colors duration-200 ${
                    hasSessionsForTime(time) 
                      ? 'bg-primary/10' 
                      : 'bg-success/10'
                  }`}>
                    <div className={`bg-card rounded-lg ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'} shadow-soft border border-border/50`}>
                      {format(time, 'HH:mm')}
                    </div>
                  </div>
                  
                  {/* Slots para cada dia */}
                  {weekDays.map((day) => {
                    const slotSessions = getSessionsForSlot(day, time);
                    
                    return (
                      <div key={`${day.toISOString()}-${time.toISOString()}`} className={isMobile ? 'min-w-[70px]' : ''}>
                        <TimeSlot
                          date={day}
                          time={time}
                          sessions={slotSessions}
                        />
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Botão "Hoje" para mobile - posicionado fixo no canto inferior */}
        {isMobile && (
          <div className="fixed bottom-4 right-4 z-20">
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="h-10 px-3 text-xs font-medium shadow-lg bg-background border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Hoje
            </Button>
          </div>
        )}

        <DragOverlay>
          {activeSession && (
            <Card className="opacity-95 rotate-1 shadow-medium bg-gradient-soft border-primary/20">
              <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>
                  {activeSession.patients?.nickname || activeSession.patients?.name}
                </div>
                <div className={`text-xs text-muted-foreground font-medium ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
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