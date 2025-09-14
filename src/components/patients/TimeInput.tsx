import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Slots pré-definidos de 30 em 30 minutos das 08:00 às 20:00
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const TimeInput = ({ value, onChange, className }: TimeInputProps) => {
  const [customTime, setCustomTime] = useState(value);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  const handleSlotSelect = (time: string) => {
    onChange(time);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTime(e.target.value);
  };

  const handleCustomTimeSave = () => {
    if (customTime) {
      onChange(customTime);
      setIsCustomDialogOpen(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Grid de slots pré-definidos */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {TIME_SLOTS.map((slot) => (
          <Badge
            key={slot}
            variant={value === slot ? "default" : "outline"}
            className={cn(
              "cursor-pointer text-center py-2 px-3 transition-all hover:scale-105",
              value === slot
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => handleSlotSelect(slot)}
          >
            {slot}
          </Badge>
        ))}
      </div>

      {/* Botão para customização */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
            onClick={() => setCustomTime(value)}
          >
            <Settings className="h-4 w-4" />
            Personalizar Horário
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar Horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário customizado</label>
              <Input
                type="time"
                value={customTime}
                onChange={handleCustomTimeChange}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCustomDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCustomTimeSave}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview do horário selecionado */}
      {value && (
        <div className="text-center text-sm text-muted-foreground">
          Horário selecionado: <span className="font-medium text-foreground">{value}</span>
        </div>
      )}
    </div>
  );
};