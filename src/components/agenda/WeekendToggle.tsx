import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';

interface WeekendToggleProps {
  showWeekends: boolean;
  onToggle: (show: boolean) => void;
}

export const WeekendToggle: React.FC<WeekendToggleProps> = ({
  showWeekends,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-2 border">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="weekend-toggle" className="text-sm font-medium cursor-pointer">
        Fins de semana
      </Label>
      <Switch
        id="weekend-toggle"
        checked={showWeekends}
        onCheckedChange={onToggle}
      />
    </div>
  );
};