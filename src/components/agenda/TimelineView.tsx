import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay, isSameDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionsRange } from '@/hooks/useSessionsRange';
import { usePatients } from '@/hooks/usePatients';
import { useSessions } from '@/hooks/useSessions';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { Session } from '@/hooks/useSessions';
import { CalendarDays, Clock, User } from 'lucide-react';

interface TimelineViewProps {
  weekStart: Date;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ weekStart }) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { sessions, isLoading } = useSessionsRange(weekStart, weekEnd);
  const { patients } = usePatients();
  const { deleteSession } = useSessions();

  // Agrupar sessões por dia
  const sessionsByDay = useMemo(() => {
    const grouped: { [key: string]: Session[] } = {};
    
    sessions.forEach(session => {
      const dayKey = format(new Date(session.scheduled_at), 'yyyy-MM-dd');
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(session);
    });

    // Ordenar sessões de cada dia por horário
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });

    return grouped;
  }, [sessions]);

  // Dias da semana com sessões ordenados
  const daysWithSessions = useMemo(() => {
    return Object.keys(sessionsByDay)
      .sort()
      .map(dayKey => ({
        date: new Date(dayKey),
        sessions: sessionsByDay[dayKey]
      }));
  }, [sessionsByDay]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
        return 'bg-success/10 border-success/20 text-success-foreground';
      case 'pendente':
        return 'bg-warning/10 border-warning/20 text-warning-foreground';
      case 'cancelado':
        return 'bg-destructive/10 border-destructive/20 text-destructive-foreground';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (daysWithSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma sessão encontrada
        </h3>
        <p className="text-muted-foreground">
          Não há sessões agendadas para esta semana.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {daysWithSessions.map(({ date, sessions: daySessions }) => (
        <div key={date.toISOString()} className="space-y-3">
          {/* Cabeçalho do dia */}
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {daySessions.length} {daySessions.length === 1 ? 'sessão' : 'sessões'}
            </Badge>
          </div>

          {/* Lista de sessões do dia */}
          <div className="space-y-2 pl-5 relative">
            {/* Linha vertical do timeline */}
            <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-border" />
            
            {daySessions.map((session, index) => {
              const sessionDate = new Date(session.scheduled_at);
              const endTime = addMinutes(sessionDate, session.duration_minutes || 50);
              const patient = patients.find(p => p.id === session.patient_id);

              return (
                <div key={session.id} className="relative">
                  {/* Ponto no timeline */}
                  <div className="absolute -left-[7px] top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  {/* Card da sessão */}
                  <Card 
                    className={`ml-4 cursor-pointer transition-all hover:shadow-medium hover:scale-[1.02] ${getStatusColor(session.status)} ${
                      session.schedule_id ? 'border-l-4 border-l-accent' : ''
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {patient?.nickname || patient?.name || 'Paciente não encontrado'}
                            </span>
                            {session.schedule_id && (
                              <Badge variant="outline" className="text-xs">
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(sessionDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
                              </span>
                            </div>
                            
                            {session.type && (
                              <Badge variant="secondary" className="text-xs">
                                {session.type}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={session.status === 'confirmado' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {session.status}
                          </Badge>
                          
                          {session.value && (
                            <span className="text-sm font-medium text-foreground">
                              R$ {session.value.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Dialog de detalhes da sessão */}
      <MoveConfirmationPopover
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        mode="view"
        session={selectedSession}
        patient={selectedSession ? patients.find(p => p.id === selectedSession.patient_id) : null}
        onConfirm={() => {}}
        onDelete={() => {
          if (selectedSession?.id) {
            deleteSession(selectedSession.id);
            setShowSessionDialog(false);
            setSelectedSession(null);
          }
        }}
      />
    </div>
  );
};