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
      className="bg-muted rounded-lg p-1"
    >
      <ToggleGroupItem 
        value="week" 
        className="flex items-center gap-2 px-4 py-2 data-[state=on]:bg-card data-[state=on]:shadow-soft"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Semana</span>
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="timeline" 
        className="flex items-center gap-2 px-4 py-2 data-[state=on]:bg-card data-[state=on]:shadow-soft"
      >
        <Clock className="h-4 w-4" />
        <span className="hidden sm:inline">Linha do tempo</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};