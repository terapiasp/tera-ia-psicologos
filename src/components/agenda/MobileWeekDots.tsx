import React, { useState, useMemo } from 'react';
import { format, addDays, setHours, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

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

  const getDotStyle = (sessionCount: number) => {
    if (sessionCount === 0) return 'bg-muted border border-border';
    if (sessionCount === 1) return 'bg-primary border border-primary shadow-soft';
    if (sessionCount === 2) return 'bg-secondary border border-secondary shadow-soft';
    return 'bg-accent border border-accent shadow-soft scale-110';
  };

  const getPatientName = (session: Session) => {
    const patient = patients.find(p => p.id === session.patient_id);
    return patient?.nickname || patient?.name || 'Paciente';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px] p-3">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2">
          <div className="text-xs font-medium text-muted-foreground text-center py-1">
            Hora
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center">
              <div className="text-xs font-semibold text-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(day, 'dd')}
              </div>
            </div>
          ))}
        </div>

        {/* Grid principal com dots */}
        <div className="grid grid-cols-8 gap-2">
          {timeSlots.map((time) => (
            <React.Fragment key={time.toISOString()}>
              {/* Coluna de horários */}
              <div className="text-xs font-medium text-muted-foreground text-center py-2 flex items-center justify-center">
                {format(time, 'HH:mm')}
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
                          w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center
                          ${getDotStyle(sessionCount)}
                          hover:scale-125 active:scale-105
                        `}
                        onClick={() => setSelectedSlot({ day, time, sessions: slotSessions })}
                      >
                        {sessionCount > 0 && (
                          <span className="text-[8px] font-bold text-white">
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
                            <div
                              key={session.id}
                              className="p-3 rounded-lg border bg-card shadow-soft"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-medium text-card-foreground">
                                  {getPatientName(session)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(session.scheduled_at), 'HH:mm')} - 
                                  {format(new Date(new Date(session.scheduled_at).getTime() + 50 * 60000), 'HH:mm')}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {session.status === 'scheduled' ? 'Agendado' : 
                                   session.status === 'completed' ? 'Concluído' : 
                                   session.status === 'cancelled' ? 'Cancelado' : session.status}
                                </Badge>
                                
                                {session.modality && (
                                  <Badge variant="outline" className="text-xs">
                                    {session.modality}
                                  </Badge>
                                )}
                              </div>
                            </div>
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
    </div>
  );
};