import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Session } from "@/hooks/useSessions";
import { useSessionsRange } from "@/hooks/useSessionsRange";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeekDay {
  date: Date;
  dayName: string;
  sessionCount: number;
  isToday: boolean;
  sessions: Session[];
}

interface WeeklyViewProps {
  onDateClick?: (date: Date) => void;
}

export function WeeklyView({ onDateClick }: WeeklyViewProps) {
  const isMobile = useIsMobile();
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Recuperar preferência de fins de semana
  const [showWeekends, setShowWeekends] = useState(() => {
    const saved = localStorage.getItem('agenda-show-weekends');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Buscar sessões da semana atual dinamicamente
  const weekEndDate = endOfWeek(currentStartDate, { weekStartsOn: 1 });
  const { sessions: sessionsData, isLoading } = useSessionsRange(currentStartDate, weekEndDate);

  const generateWeekData = (startDate: Date): WeekDay[] => {
    const weekData: WeekDay[] = [];
    
    // Definir quantos dias mostrar baseado na configuração de fins de semana
    const daysToShow = showWeekends ? 7 : 5;
    
    for (let i = 0; i < daysToShow; i++) {
      const currentDate = addDays(startDate, i);
      
      // Filtrar sessões para esta data
      const daySessions = sessionsData.filter(session => 
        isSameDay(new Date(session.scheduled_at), currentDate)
      );
      
      weekData.push({
        date: currentDate,
        dayName: format(currentDate, 'EEE', { locale: ptBR }),
        sessionCount: daySessions.length,
        isToday: isToday(currentDate),
        sessions: daySessions
      });
    }
    
    return weekData;
  };

  const weekData = generateWeekData(currentStartDate);

  const handlePrevious = () => {
    setCurrentStartDate(prev => addDays(prev, -7));
  };

  const handleNext = () => {
    setCurrentStartDate(prev => addDays(prev, 7));
  };

  const handleDayClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    setCurrentStartDate(todayWeekStart);
  };

  const formatWeekRange = (startDate: Date) => {
    const endDate = addDays(startDate, 6);
    const startMonth = format(startDate, 'MMM', { locale: ptBR });
    const endMonth = format(endDate, 'MMM', { locale: ptBR });
    const year = format(startDate, 'yyyy');
    
    if (startMonth === endMonth) {
      return `${format(startDate, 'd')}–${format(endDate, 'd')} de ${startMonth} de ${year}`;
    } else {
      return `${format(startDate, 'd')} de ${startMonth} – ${format(endDate, 'd')} de ${endMonth} de ${year}`;
    }
  };

  // Ajustar para mostrar a semana atual na inicialização
  useEffect(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    if (currentStartDate.getTime() !== currentWeekStart.getTime()) {
      setCurrentStartDate(currentWeekStart);
    }
  }, []); // Array de dependências vazio para executar apenas uma vez

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all duration-200 border-0 bg-gradient-soft">
      <CardContent className="p-4 md:p-6">
        {/* Header com título, período e navegação */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Visão Semanal
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatWeekRange(currentStartDate)}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="hidden md:flex h-8 px-3 text-xs hover:bg-primary/10"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-8 w-8 hover:bg-primary/10"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 hover:bg-primary/10"
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Container dos dias com scroll horizontal no mobile */}
        <div className={`w-full ${isMobile ? 'overflow-x-auto' : ''}`}>
          <div className={`flex gap-2 ${isMobile ? 'pb-2 snap-x snap-mandatory' : 'px-1'}`}>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: showWeekends ? 7 : 5 }).map((_, index) => (
                <div 
                  key={index} 
                  className={`${
                    isMobile 
                      ? 'flex-shrink-0 w-24 snap-center' 
                      : 'flex-1 min-w-[80px]'
                  } p-3 rounded-xl border bg-card/50`}
                >
                  <div className="text-center space-y-2">
                    <Skeleton className="h-3 w-8 mx-auto" />
                    <Skeleton className="h-6 w-6 mx-auto rounded-full" />
                    <Skeleton className="h-3 w-6 mx-auto" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                </div>
              ))
            ) : (
              weekData.map((day, index) => {
                const dayMonth = format(day.date, 'MMM', { locale: ptBR });
                const firstTwoSessions = day.sessions.slice(0, 2);
                const remainingSessions = day.sessionCount - 2;

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day.date)}
                    className={`
                      ${isMobile 
                        ? 'flex-shrink-0 w-24 snap-center touch-manipulation' 
                        : 'flex-1 min-w-[80px]'
                      }
                      p-3 rounded-xl border cursor-pointer transition-all duration-200
                      hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                      ${day.isToday 
                        ? 'bg-primary/10 border-primary/30 shadow-soft' 
                        : 'bg-card border-border/30 hover:bg-accent/30 hover:border-primary/20'
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    aria-label={`${day.dayName}, ${format(day.date, 'd')} de ${dayMonth}. ${day.sessionCount} ${day.sessionCount === 1 ? 'sessão' : 'sessões'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDayClick(day.date);
                      }
                    }}
                  >
                    <div className="text-center space-y-2">
                      {/* Dia da semana */}
                      <p className={`text-xs font-medium uppercase tracking-wide ${
                        day.isToday ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {day.dayName}
                      </p>
                      
                      {/* Data e mês */}
                      <div className="space-y-1">
                        <p className={`text-xl font-bold ${
                          day.isToday ? 'text-primary' : 'text-foreground'
                        }`}>
                          {format(day.date, 'd')}
                        </p>
                        <p className={`text-xs ${
                          day.isToday ? 'text-primary/80' : 'text-muted-foreground'
                        }`}>
                          {dayMonth}
                        </p>
                      </div>
                      
                      {/* Sessões */}
                      {day.sessionCount > 0 && (
                        <div className="space-y-1">
                          {/* Contador principal */}
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            day.isToday 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent text-accent-foreground'
                          }`}>
                            {day.sessionCount} {day.sessionCount === 1 ? 'sessão' : 'sessões'}
                          </div>
                          
                          {/* Preview das primeiras sessões (apenas no desktop) */}
                          {!isMobile && firstTwoSessions.length > 0 && (
                            <div className="space-y-1">
                              {firstTwoSessions.map((session, sessionIndex) => (
                                <div 
                                  key={sessionIndex}
                                  className="text-xs px-1.5 py-0.5 bg-muted/50 text-muted-foreground rounded border"
                                >
                                  {format(new Date(session.scheduled_at), 'HH:mm')}
                                </div>
                              ))}
                              {remainingSessions > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  +{remainingSessions}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Botão Hoje no mobile */}
        {isMobile && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-4 text-xs"
            >
              Ir para hoje
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}