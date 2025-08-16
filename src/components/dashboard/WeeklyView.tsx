import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Session } from "@/hooks/useSessions";
import { useSessionsRange } from "@/hooks/useSessionsRange";
import { Skeleton } from "@/components/ui/skeleton";

interface WeekDay {
  date: Date;
  dayName: string;
  sessionCount: number;
  isToday: boolean;
}

interface WeeklyViewProps {
  onDateClick?: (date: Date) => void;
}

export function WeeklyView({ onDateClick }: WeeklyViewProps) {
  console.log('WeeklyView: Rendering');
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Buscar sessões da semana atual dinamicamente
  const weekEndDate = endOfWeek(currentStartDate, { weekStartsOn: 1 });
  const { sessions: sessionsData, isLoading } = useSessionsRange(currentStartDate, weekEndDate);

  const generateWeekData = (startDate: Date): WeekDay[] => {
    const weekData: WeekDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      
      // Contar sessões para esta data
      const daySessionsCount = sessionsData.filter(session => 
        isSameDay(new Date(session.scheduled_at), currentDate)
      ).length;
      
      weekData.push({
        date: currentDate,
        dayName: format(currentDate, 'EEE', { locale: ptBR }),
        sessionCount: daySessionsCount,
        isToday: isToday(currentDate)
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

  // Ajustar para mostrar a semana atual na inicialização
  useEffect(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    if (currentStartDate.getTime() !== currentWeekStart.getTime()) {
      setCurrentStartDate(currentWeekStart);
    }
  }, []);

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all duration-200 border-0 bg-gradient-soft">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Visão Semanal</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 px-1">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex-1 min-w-[80px] p-3 rounded-lg border">
                  <div className="text-center space-y-1">
                    <Skeleton className="h-3 w-8 mx-auto" />
                    <Skeleton className="h-6 w-6 mx-auto" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                </div>
              ))
            ) : (
              weekData.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    flex-1 min-w-[80px] p-3 rounded-lg border cursor-pointer transition-all
                    hover:shadow-md hover:border-primary/20
                    ${day.isToday 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-card border-border hover:bg-accent/50'
                    }
                  `}
                >
                  <div className="text-center space-y-1">
                    <p className={`text-xs font-medium ${
                      day.isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {day.dayName}
                    </p>
                    <p className={`text-lg font-bold ${
                      day.isToday ? 'text-primary' : 'text-foreground'
                    }`}>
                      {format(day.date, 'd')}
                    </p>
                    {day.sessionCount > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        day.isToday 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        {day.sessionCount} sessão{day.sessionCount !== 1 ? 'ões' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}