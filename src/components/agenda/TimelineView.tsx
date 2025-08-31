import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, Banknote, Calendar, RefreshCw, ChevronUp, CalendarDays, User, Loader2 } from 'lucide-react';
import { MoveConfirmationPopover } from './MoveConfirmationPopover';
import { useInfiniteSessions } from '@/hooks/useInfiniteSessions';
import { usePatients } from '@/hooks/usePatients';
import { Session } from '@/hooks/useSessions';

interface TimelineViewProps {
  statusFilter?: string;
  patientFilter?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  statusFilter = 'all',
  patientFilter = 'all'
}) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const { 
    sessions, 
    isLoading, 
    isLoadingMore, 
    isLoadingPrevious,
    hasMore, 
    lastElementRef, 
    loadPrevious,
    deleteSession,
    error,
    retryFetch
  } = useInfiniteSessions();
  const { patients } = usePatients();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);

  // Filtrar sessões antes de agrupar
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Filtro por status
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false;
      }
      
      // Filtro por paciente
      if (patientFilter !== 'all' && session.patient_id !== patientFilter) {
        return false;
      }
      
      return true;
    });
  }, [sessions, statusFilter, patientFilter]);

  // Agrupar sessões filtradas por dia e ordenar por horário
  const sessionsByDay = useMemo(() => {
    const grouped = filteredSessions.reduce((acc, session) => {
      const dayKey = format(new Date(session.scheduled_at), 'yyyy-MM-dd');
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    // Ordenar sessões de cada dia por horário
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    });

    return grouped;
  }, [filteredSessions]);

  // Converter para array ordenado por data
  const daysWithSessions = useMemo(() => {
    return Object.entries(sessionsByDay)
      .map(([date, sessions]) => ({
        date: new Date(date),
        sessions
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sessionsByDay]);

  // Observer para carregar sessões anteriores
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingPrevious) {
          loadPrevious();
        }
      },
      { rootMargin: '100px' }
    );

    if (topObserverRef.current) {
      observer.observe(topObserverRef.current);
    }

    return () => observer.disconnect();
  }, [loadPrevious, isLoadingPrevious]);

  // Observer para scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setShowScrollToTop(scrollTop > 500);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDialog(true);
  };

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
      case 'confirmed':
      case 'scheduled':
        return 'bg-success/10 border-success/20 text-success-foreground';
      case 'completed':
        return 'bg-primary/10 border-primary/20 text-primary-foreground';
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
      case 'completed':
        return 'Concluído';
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

  return (
    <div ref={containerRef} className="relative h-[calc(100vh-200px)] overflow-y-auto space-y-4 p-4">
      {/* Observer para carregar sessões anteriores */}
      <div ref={topObserverRef} className="h-4">
        {isLoadingPrevious && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Carregando sessões anteriores...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={retryFetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        // Skeleton enquanto carrega
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : daysWithSessions.length === 0 && !isLoadingMore ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {statusFilter !== 'all' || patientFilter !== 'all' 
              ? 'Nenhuma sessão encontrada com os filtros aplicados'
              : 'Nenhuma sessão encontrada'
            }
          </p>
          {(statusFilter !== 'all' || patientFilter !== 'all') && (
            <p className="text-sm text-muted-foreground mt-2">
              Tente ajustar os filtros para ver mais resultados
            </p>
          )}
        </div>
      ) : (
        <>
          {daysWithSessions.map((dayData, dayIndex) => (
            <div key={dayData.date.toISOString()} className="space-y-3">
              {/* Cabeçalho do dia */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b border-border/20">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {format(dayData.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {dayData.sessions.length} sessões
                  </Badge>
                </h3>
              </div>

              {/* Sessões do dia */}
              <div className="space-y-3">
                {dayData.sessions.map((session, sessionIndex) => {
                  const patient = patients.find(p => p.id === session.patient_id);
                  const sessionTime = new Date(session.scheduled_at);
                  const endTime = new Date(sessionTime.getTime() + (session.duration_minutes || 50) * 60000);
                  
                  // Aplicar ref no último elemento para infinite scroll
                  const isLastSession = dayIndex === daysWithSessions.length - 1 && 
                                       sessionIndex === dayData.sessions.length - 1;
                  
                  return (
                    <Card 
                      key={session.id}
                      ref={isLastSession ? lastElementRef : undefined}
                      className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4"
                      style={{ borderLeftColor: `hsl(var(--${getStatusColor(session.status).replace('border-', '').replace('/20', '')}))` }}
                      onClick={() => handleSessionClick(session)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-foreground text-lg">
                                {patient?.nickname || patient?.name || 'Paciente não encontrado'}
                              </h4>
                              <Badge variant="outline" className={getStatusColor(session.status)}>
                                {getStatusLabel(session.status)}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(sessionTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                </span>
                                <span className="text-xs">
                                  ({session.duration_minutes || 50}min)
                                </span>
                              </div>
                              
                              {session.value && (
                                <div className="flex items-center gap-1">
                                  <Banknote className="h-4 w-4" />
                                  <span>R$ {Number(session.value).toFixed(2)}</span>
                                  {session.paid && (
                                    <Badge variant="secondary" className="text-xs ml-1">
                                      Pago
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Carregando mais sessões...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Scroll to top button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
          size="icon"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
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