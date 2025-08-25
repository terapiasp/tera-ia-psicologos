import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { format, addDays, addWeeks, subWeeks, addMinutes, startOfDay, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { SessionCard } from './SessionCard';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { Session } from '@/hooks/useSessions';

interface MobileAgendaViewProps {
  weekStart: Date;
  onWeekChange: (week: Date) => void;
  sessions: Session[];
  patients: any[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeSession: Session | null;
  showMoveDialog: boolean;
  setShowMoveDialog: (show: boolean) => void;
  moveData: { session: Session; targetDateTime: Date } | null;
  onMoveConfirm: (moveType: 'single' | 'series') => void;
  onDelete: () => void;
}

export const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({
  weekStart,
  onWeekChange,
  sessions,
  patients,
  onDragStart,
  onDragEnd,
  activeSession,
  showMoveDialog,
  setShowMoveDialog,
  moveData,
  onMoveConfirm,
  onDelete,
}) => {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    // Se hoje está na semana atual, seleciona hoje, senão seleciona segunda-feira
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return weekDays.find(day => isToday(day)) || weekStart;
  });

  // Gerar dias da semana
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Sessões do dia selecionado organizadas por horário
  const daySchedule = useMemo(() => {
    const daySessions = sessions.filter(session => 
      isSameDay(new Date(session.scheduled_at), selectedDay)
    );

    // Agrupar por hora
    const schedule: { [hour: string]: Session[] } = {};
    daySessions.forEach(session => {
      const hour = format(new Date(session.scheduled_at), 'HH:mm');
      if (!schedule[hour]) {
        schedule[hour] = [];
      }
      schedule[hour].push(session);
    });

    return Object.entries(schedule)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, sessions]) => ({ time, sessions }));
  }, [sessions, selectedDay]);

  const goToPreviousWeek = () => {
    const newWeek = subWeeks(weekStart, 1);
    onWeekChange(newWeek);
    setSelectedDay(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(weekStart, 1);
    onWeekChange(newWeek);
    setSelectedDay(newWeek);
  };

  const goToToday = () => {
    const today = new Date();
    onWeekChange(today);
    setSelectedDay(today);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Header com navegação */}
        <div className="sticky top-0 bg-background z-20 border-b border-border/50 pb-3">
          {/* Navegação de semana */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="h-9 px-4 text-sm font-medium"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Hoje
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-lg font-semibold text-foreground">
              {format(weekStart, 'MMMM yyyy', { locale: ptBR })}
            </div>
          </div>

          {/* Seletor de dias */}
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);
                const dayHasSessions = sessions.some(session => 
                  isSameDay(new Date(session.scheduled_at), day)
                );

                return (
                  <Button
                    key={day.toISOString()}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                    className={`
                      flex-shrink-0 min-w-[60px] h-16 flex flex-col gap-1 p-2
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : isCurrentDay 
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }
                      ${dayHasSessions && !isSelected ? 'border border-primary/30' : ''}
                    `}
                  >
                    <span className="text-xs font-medium">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={`text-lg font-bold ${isCurrentDay && !isSelected ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayHasSessions && (
                      <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto">
          {/* Cabeçalho do dia selecionado */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                {daySchedule.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {daySchedule.length === 1 
                      ? '1 compromisso'
                      : `${daySchedule.length} compromissos`
                    }
                  </p>
                )}
              </div>
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
          </div>

          {/* Lista de sessões */}
          <div className="px-4 py-2">
            {daySchedule.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg mb-2">
                  Nenhum compromisso hoje
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Que tal aproveitar para relaxar?
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar sessão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {daySchedule.map(({ time, sessions: timeSessions }) => (
                  <div key={time} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {time}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-2 ml-2">
                      {timeSessions.map((session) => (
                        <Card 
                          key={session.id} 
                          className="bg-gradient-soft border-l-4 border-l-primary hover:shadow-soft transition-all duration-200"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1">
                                  {session.patients?.nickname || session.patients?.name}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>
                                    {format(new Date(session.scheduled_at), 'HH:mm')} - {' '}
                                    {format(addMinutes(new Date(session.scheduled_at), 50), 'HH:mm')}
                                  </span>
                                  {/* Therapy type will be shown when patient data is properly typed */}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Source badge will be shown when patient data is properly typed */}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeSession && (
            <Card className="opacity-95 shadow-medium bg-gradient-soft border-primary/20">
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
        patient={moveData?.session ? patients.find(p => p.id === moveData.session.patient_id) : null}
        onConfirm={onMoveConfirm}
        onDelete={onDelete}
      />
    </div>
  );
};