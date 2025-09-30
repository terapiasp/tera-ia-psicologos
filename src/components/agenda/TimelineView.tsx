import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, addMinutes, startOfWeek, startOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatients } from '@/hooks/usePatients';
import { useInfiniteSessions } from '@/hooks/useInfiniteSessions';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { Session } from '@/hooks/useSessions';
import { CalendarDays, Clock, User, Loader2 } from 'lucide-react';
import { SessionLinkButton } from './SessionLinkButton';

interface TimelineViewProps {
  selectedDate?: Date; // Data para rolar automaticamente
  openSessionId?: string; // ID da sessão para abrir automaticamente
}

export const TimelineView: React.FC<TimelineViewProps> = ({ selectedDate, openSessionId }) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Refs para os elementos dos dias para scroll automático
  const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { sessions, isLoading, isLoadingMore, hasMore, lastElementRef, deleteSession } = useInfiniteSessions();
  const { patients } = usePatients();

  // Agrupar sessões por dia
  const sessionsByDay = useMemo(() => {
    const grouped: { [key: string]: Session[] } = {};
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.scheduled_at);
      const dayKey = format(sessionDate, 'yyyy-MM-dd');
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
      .map(dayKey => {
        // Usar a primeira sessão do dia para obter a data correta
        const firstSession = sessionsByDay[dayKey][0];
        const sessionDate = new Date(firstSession.scheduled_at);
        return {
          date: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate()),
          sessions: sessionsByDay[dayKey]
        };
      });
  }, [sessionsByDay]);

  // Scroll automático para data selecionada e abrir sessão específica
  useEffect(() => {
    if (selectedDate && !isLoading) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const targetDayElement = dayRefs.current[dateKey];
      
      if (targetDayElement) {
        // Esperar um pouco para os elementos renderizarem
        setTimeout(() => {
          // Encontrar o índice da data selecionada
          const selectedIndex = daysWithSessions.findIndex(
            day => format(day.date, 'yyyy-MM-dd') === dateKey
          );
          
          if (selectedIndex > 0) {
            // Se não é o primeiro elemento, fazer scroll para o elemento anterior
            // assim a data selecionada ficará na segunda posição
            const previousDateKey = format(daysWithSessions[selectedIndex - 1].date, 'yyyy-MM-dd');
            const previousDayElement = dayRefs.current[previousDateKey];
            
            if (previousDayElement) {
              previousDayElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }
          } else {
            // Se é o primeiro elemento, fazer scroll normal
            targetDayElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
          
          // Se há um ID de sessão específica para abrir, fazer isso após o scroll
          if (openSessionId) {
            setTimeout(() => {
              const sessionToOpen = sessions.find(s => s.id === openSessionId);
              if (sessionToOpen) {
                handleSessionClick(sessionToOpen);
              }
            }, 500);
          }
        }, 100);
      }
    }
  }, [selectedDate, isLoading, daysWithSessions.length, openSessionId, sessions]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
      case 'confirmed':
      case 'scheduled':
        return 'bg-success/10 border-success/20 text-success-foreground';
      case 'pendente':
      case 'pending':
        return 'bg-warning/10 border-warning/20 text-warning-foreground';
      case 'cancelado':
      case 'cancelled':
        return 'bg-destructive/10 border-destructive/20 text-destructive-foreground';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
      case 'confirmed':
      case 'scheduled':
        return 'Agendado';
      case 'pendente':
      case 'pending':
        return 'Pendente';
      case 'cancelado':
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
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
      1: 'bg-blue-600 border-blue-600/30 shadow-blue-600/25', // Safira
      2: 'bg-emerald-600 border-emerald-600/30 shadow-emerald-600/25', // Esmeralda  
      3: 'bg-purple-600 border-purple-600/30 shadow-purple-600/25', // Ametista
      4: 'bg-amber-600 border-amber-600/30 shadow-amber-600/25', // Âmbar
      5: 'bg-red-600 border-red-600/30 shadow-red-600/25' // Ruby
    };
    return gemColors[weekOfMonth as keyof typeof gemColors] || gemColors[1];
  };

  // Cor de marcação do card baseada na semana
  const getWeekAccentColor = (date: Date) => {
    const weekOfMonth = getWeekOfMonth(date);
    const accentColors = {
      1: 'border-l-blue-600/70', // Safira
      2: 'border-l-emerald-600/70', // Esmeralda  
      3: 'border-l-purple-600/70', // Ametista
      4: 'border-l-amber-600/70', // Âmbar
      5: 'border-l-red-600/70' // Ruby
    };
    return accentColors[weekOfMonth as keyof typeof accentColors] || accentColors[1];
  };

  // Efeito hover/neon baseado na semana
  const getWeekHoverEffect = (date: Date) => {
    const weekOfMonth = getWeekOfMonth(date);
    const hoverEffects = {
      1: 'hover:shadow-lg hover:shadow-blue-600/20 hover:border-blue-600/50', // Safira
      2: 'hover:shadow-lg hover:shadow-emerald-600/20 hover:border-emerald-600/50', // Esmeralda  
      3: 'hover:shadow-lg hover:shadow-purple-600/20 hover:border-purple-600/50', // Ametista
      4: 'hover:shadow-lg hover:shadow-amber-600/20 hover:border-amber-600/50', // Âmbar
      5: 'hover:shadow-lg hover:shadow-red-600/20 hover:border-red-600/50' // Ruby
    };
    return hoverEffects[weekOfMonth as keyof typeof hoverEffects] || hoverEffects[1];
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

  if (daysWithSessions.length === 0 && !isLoadingMore) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma sessão encontrada
        </h3>
        <p className="text-muted-foreground">
          Não há sessões agendadas no período atual.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 sm:p-4 overflow-x-hidden">
      {daysWithSessions.map(({ date, sessions: daySessions }, dayIndex) => {
        const isNewMonth = dayIndex > 0 && 
          daysWithSessions[dayIndex - 1].date.getMonth() !== date.getMonth();
        
        return (
          <React.Fragment key={date.toISOString()}>
            {/* Separador de mês */}
            {isNewMonth && (
              <div className="flex items-center gap-4 py-6 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="bg-muted/50 px-6 py-3 rounded-full border border-border shadow-soft">
                  <span className="text-lg font-bold text-foreground capitalize">
                    {format(date, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
              </div>
            )}

            <div 
              className="space-y-3"
              ref={(el) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                dayRefs.current[dateKey] = el;
                // Manter a ref do último elemento para infinite scroll
                if (dayIndex === daysWithSessions.length - 1) {
                  lastElementRef(el);
                }
              }}
            >
              {/* Cabeçalho do dia */}
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full shadow-lg ${getWeekGemColor(date)}`} />
                  <h3 className="text-lg font-semibold text-foreground">
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                </div>
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
                      {/* Card da sessão */}
                      <Card 
                        className={`ml-4 cursor-pointer transition-all hover:scale-[1.02] bg-muted/30 border-border/50 text-foreground border-l-4 ${getWeekAccentColor(date)} ${getWeekHoverEffect(date)}`}
                        onClick={() => handleSessionClick(session)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                                  {patient?.nickname || patient?.name || 'Paciente não encontrado'}
                                </span>
                                {session.schedule_id && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    Recorrente
                                  </Badge>
                                )}
                                {patient && (
                                  <SessionLinkButton 
                                    patient={patient}
                                    size="sm"
                                    variant="icon"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs sm:text-sm">
                                    {format(sessionDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                  </span>
                                </div>
                                
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {session.duration_minutes || 50} min
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end gap-2 justify-between sm:justify-start flex-shrink-0">
                              <Badge 
                                variant={session.status === 'confirmado' || session.status === 'confirmed' || session.status === 'scheduled' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {getStatusLabel(session.status)}
                              </Badge>
                              
                              {session.value && (
                                <span className="text-sm font-medium text-foreground whitespace-nowrap">
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
          </React.Fragment>
        );
      })}

      {/* Loading indicator para carregamento incremental */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando mais sessões...</span>
          </div>
        </div>
      )}

      {/* Indicador de fim */}
      {!hasMore && daysWithSessions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Não há mais sessões para carregar</p>
        </div>
      )}

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