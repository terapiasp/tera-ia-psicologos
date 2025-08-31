import React, { useState, useMemo } from 'react';
import { format, addDays, setHours, startOfDay, isSameDay, startOfWeek, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { SessionEventCard } from './SessionEventCard';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';

interface MobileWeekDotsProps {
  weekStart: Date;
  sessions: Session[];
  patients: Patient[];
}

export const MobileWeekDots: React.FC<MobileWeekDotsProps> = ({ 
  weekStart, 
  sessions, 
  patients 
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; time: Date; sessions: Session[] } | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ session: Session; mode: 'view' | 'move' } | null>(null);

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

  const getSessionsForSlot = (day: Date, time: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      return isSameDay(sessionDate, day) && 
             sessionDate.getHours() === time.getHours();
    });
  };

  const getDotStyle = (sessionCount: number, sessions: Session[]) => {
    if (sessionCount === 0) return 'bg-muted/50 border border-border';
    
    // Usar cor baseada na semana do mês para qualquer sessão
    if (sessions.length > 0) {
      const sessionDate = new Date(sessions[0].scheduled_at);
      return getWeekGemColor(sessionDate);
    }
    
    return 'bg-primary border border-primary shadow-soft';
  };

  // Calcular a semana do mês para cores das pedras preciosas
  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = startOfMonth(date);
    const firstWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    
    const diffInWeeks = Math.floor((currentWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(5, diffInWeeks + 1));
  };

  // Cores das pedras preciosas para cada semana
  const getWeekGemColor = (date: Date) => {
    const weekOfMonth = getWeekOfMonth(date);
    const gemColors = {
      1: 'bg-blue-600 border border-blue-600 shadow-soft', // Safira
      2: 'bg-emerald-600 border border-emerald-600 shadow-soft', // Esmeralda  
      3: 'bg-purple-600 border border-purple-600 shadow-soft', // Ametista
      4: 'bg-amber-600 border border-amber-600 shadow-soft', // Âmbar
      5: 'bg-red-600 border border-red-600 shadow-soft' // Ruby
    };
    return gemColors[weekOfMonth as keyof typeof gemColors] || gemColors[1];
  };

  const getDayAbbreviation = (day: Date) => {
    const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
    return dayNames[day.getDay()];
  };

  const getPatientName = (session: Session) => {
    const patient = patients.find(p => p.id === session.patient_id);
    return patient?.nickname || patient?.name || 'Paciente';
  };

  // Verificar se há sessões em determinado horário em qualquer dia da semana
  const hasSessionsForTime = (time: Date) => {
    return weekDays.some(day => getSessionsForSlot(day, time).length > 0);
  };

  return (
    <div className="w-full max-w-full p-2">
      <div className="w-full">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2">
          <div className="text-[10px] font-medium text-muted-foreground text-center py-1">
            Hora
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center">
              <div className="text-xs font-semibold text-foreground">
                {getDayAbbreviation(day)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {format(day, 'dd')}
              </div>
            </div>
          ))}
        </div>

        {/* Grid principal com dots */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1">
          {timeSlots.map((time) => (
            <React.Fragment key={time.toISOString()}>
              {/* Coluna de horários */}
              <div className="flex items-center justify-center py-1">
                <Badge 
                  variant={hasSessionsForTime(time) ? "destructive" : "secondary"}
                  className={`text-[10px] font-medium px-2 py-1 ${
                    hasSessionsForTime(time) 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-success/10 text-success border-success/20'
                  }`}
                >
                  {format(time, 'HH')}h
                </Badge>
              </div>
              
              {/* Dots para cada dia */}
              {weekDays.map((day) => {
                const slotSessions = getSessionsForSlot(day, time);
                const sessionCount = slotSessions.length;
                
                return (
                  <Sheet key={`${day.toISOString()}-${time.toISOString()}`}>
                    <SheetTrigger asChild>
                      <button
                        className={`
                          w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center
                          ${getDotStyle(sessionCount, slotSessions)}
                          hover:scale-125 active:scale-105
                        `}
                        onClick={() => setSelectedSlot({ day, time, sessions: slotSessions })}
                      >
                        {sessionCount > 0 && (
                          <span className="text-[7px] font-bold text-white">
                            {sessionCount > 3 ? '3+' : sessionCount}
                          </span>
                        )}
                      </button>
                    </SheetTrigger>
                    
                    <SheetContent side="bottom" className="h-[50vh]">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(day, 'EEEE, dd/MM', { locale: ptBR })} às {format(time, 'HH:mm')}
                        </SheetTitle>
                      </SheetHeader>
                      
                      <div className="mt-4 space-y-3">
                        {slotSessions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum compromisso neste horário</p>
                          </div>
                        ) : (
                          slotSessions.map((session) => (
                            <SessionEventCard
                              key={session.id}
                              session={session}
                              patient={patients.find(p => p.id === session.patient_id)}
                              onSessionClick={(session) => {
                                setSelectedSlot(null);
                                setSelectedSession({ session, mode: 'view' });
                              }}
                            />
                          ))
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Move Confirmation Popover */}
      {selectedSession && (
        <MoveConfirmationPopover
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
          mode={selectedSession.mode}
          session={selectedSession.session}
          patient={patients.find(p => p.id === selectedSession.session.patient_id)}
          onConfirm={(moveType) => {
            // TODO: Implementar lógica de mover sessão
            console.log('Move session:', moveType, selectedSession.session);
            setSelectedSession(null);
          }}
          onDelete={() => {
            // TODO: Implementar lógica de deletar sessão
            console.log('Delete session:', selectedSession.session);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
};