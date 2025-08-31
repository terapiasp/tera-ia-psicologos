import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (week: Date) => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentWeek,
  onWeekChange,
}) => {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const goToPreviousWeek = () => {
    onWeekChange(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    onWeekChange(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentWeek}
            className="h-8 px-3 text-xs font-medium hover:bg-muted"
          >
            Hoje
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
};