import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { addDays, subDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeekDay {
  date: string;
  day: string;
  sessions: number;
  isToday?: boolean;
  fullDate: Date;
}

interface WeeklyViewProps {
  onDateClick?: (date: Date) => void;
  sessionsData: Array<{ scheduled_at: string; [key: string]: any }>;
}

export function WeeklyView({ onDateClick, sessionsData }: WeeklyViewProps) {
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    // Começar com um dia antes de hoje
    return subDays(today, 1);
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gerar 7 dias consecutivos começando do currentStartDate
  const generateWeekData = (): WeekDay[] => {
    const days: WeekDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentStartDate, i);
      const sessionsCount = sessionsData.filter(session => 
        isSameDay(new Date(session.scheduled_at), date)
      ).length;
      
      days.push({
        date: format(date, "dd/MM"),
        day: format(date, "EEEEEE", { locale: ptBR }),
        sessions: sessionsCount,
        isToday: isSameDay(date, new Date()),
        fullDate: date
      });
    }
    
    return days;
  };

  const weekData = generateWeekData();

  const handlePrevious = () => {
    setCurrentStartDate(prev => subDays(prev, 1));
  };

  const handleNext = () => {
    setCurrentStartDate(prev => addDays(prev, 1));
  };

  const handleDayClick = (day: WeekDay) => {
    if (onDateClick) {
      onDateClick(day.fullDate);
    }
  };

  // Auto-avançar os dias conforme o tempo passa
  useEffect(() => {
    const today = new Date();
    const todayIndex = weekData.findIndex(day => day.isToday);
    
    // Se hoje não está no índice 1 (segundo da lista), ajustar
    if (todayIndex !== -1 && todayIndex !== 1) {
      const daysToAdjust = todayIndex - 1;
      setCurrentStartDate(prev => addDays(prev, daysToAdjust));
    }
  }, []);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Visão Semanal</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-2 pb-2">
            {weekData.map((day) => (
              <div
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={`min-w-[120px] text-center p-3 rounded-lg transition-colors cursor-pointer ${
                  day.isToday
                    ? "bg-gradient-primary text-white"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="text-xs font-medium opacity-75 mb-1">
                  {day.day}
                </div>
                <div className={`text-lg font-bold mb-2 ${
                  day.isToday ? "text-white" : "text-foreground"
                }`}>
                  {day.date}
                </div>
                <Badge 
                  variant={day.isToday ? "secondary" : "outline"} 
                  className={`text-xs ${
                    day.isToday 
                      ? "bg-white/20 text-white border-white/30" 
                      : day.sessions === 0 
                      ? "opacity-50" 
                      : ""
                  }`}
                >
                  {day.sessions === 0 ? "Livre" : `${day.sessions} sessões`}
                </Badge>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}