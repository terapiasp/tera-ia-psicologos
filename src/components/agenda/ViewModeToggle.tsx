import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, Clock } from 'lucide-react';

interface ViewModeToggleProps {
  value: 'week' | 'timeline';
  onValueChange: (value: 'week' | 'timeline') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onValueChange,
}) => {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(newValue) => {
        if (newValue) onValueChange(newValue as 'week' | 'timeline');
      }}
      className="bg-muted/50 rounded-lg p-1 border"
    >
      <ToggleGroupItem 
        value="week" 
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted-foreground hover:text-foreground"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Semana</span>
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="timeline" 
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted-foreground hover:text-foreground"
      >
        <Clock className="h-4 w-4" />
        <span className="hidden sm:inline">Linha do tempo</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};