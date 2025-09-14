import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Slots de horários cheios das 06:00 às 23:00
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export const TimeInput = ({ value, onChange, className }: TimeInputProps) => {
  const handleSlotClick = (slot: string) => {
    if (value === slot) {
      // Se é o horário já selecionado, incrementa 10 minutos
      incrementMinutes();
    } else {
      // Se é um novo horário, seleciona ele
      onChange(slot);
    }
  };

  const incrementMinutes = () => {
    if (!value) return;

    const [hours, minutes] = value.split(':').map(Number);
    const currentMinutes = minutes + 10;

    if (currentMinutes >= 60) {
      // Se passou de 50min (próximo seria 60), vai para a próxima hora
      const nextHour = hours + 1;
      if (nextHour <= 23) {
        onChange(`${nextHour.toString().padStart(2, '0')}:00`);
      }
    } else {
      // Incrementa 10 minutos
      onChange(`${hours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`);
    }
  };

  const getDisplayTime = (slot: string) => {
    // Se o slot está selecionado, mostra o horário atual (que pode ter minutos)
    if (value && value.startsWith(slot.split(':')[0] + ':')) {
      return value;
    }
    return slot;
  };

  const isSlotSelected = (slot: string) => {
    if (!value) return false;
    const slotHour = slot.split(':')[0];
    const valueHour = value.split(':')[0];
    return slotHour === valueHour;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Grid de slots pré-definidos */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {TIME_SLOTS.map((slot) => {
          const selected = isSlotSelected(slot);
          const displayTime = getDisplayTime(slot);
          
          return (
            <Badge
              key={slot}
              variant={selected ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-center py-2 px-3 transition-all hover:scale-105",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleSlotClick(slot)}
            >
              {displayTime}
            </Badge>
          );
        })}
      </div>

      {/* Dica no rodapé */}
      <div className="text-center text-xs text-muted-foreground">
        Clique em um horário já selecionado para adicionar minutos
      </div>

      {/* Preview do horário selecionado */}
      {value && (
        <div className="text-center text-sm text-muted-foreground">
          Horário selecionado: <span className="font-medium text-foreground">{value}</span>
        </div>
      )}
    </div>
  );
};