import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RecurrencePattern } from "@/types/frequency";
import { useFrequencyPresets } from "@/hooks/useFrequencyPresets";

interface CustomFrequencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (preset: { name: string; pattern: RecurrencePattern }) => void;
}

export const CustomFrequencyDialog: React.FC<CustomFrequencyDialogProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const { calculateEstimatedSessions } = useFrequencyPresets();
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState<RecurrencePattern>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    sessionsPerCycle: 1,
  });

  const daysOfWeek = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
  ];

  const toggleDayOfWeek = (day: number) => {
    const current = pattern.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    
    setPattern({ ...pattern, daysOfWeek: updated });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({ name: name.trim(), pattern });
    onOpenChange(false);
    setName("");
    setPattern({
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
      sessionsPerCycle: 1,
    });
  };

  const getEstimatedSessions = () => {
    return calculateEstimatedSessions(pattern);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Frequência Personalizada</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Frequência</Label>
            <Input
              id="name"
              placeholder="Ex: 2x por semana, Mensal, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Tipo de Frequência</Label>
            <Select 
              value={pattern.frequency} 
              onValueChange={(value: any) => setPattern({ 
                ...pattern, 
                frequency: value,
                daysOfWeek: value === 'monthly' ? [] : pattern.daysOfWeek 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Intervalo</Label>
            <Select 
              value={pattern.interval.toString()} 
              onValueChange={(value) => setPattern({ ...pattern, interval: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">A cada 1</SelectItem>
                <SelectItem value="2">A cada 2</SelectItem>
                <SelectItem value="3">A cada 3</SelectItem>
                <SelectItem value="4">A cada 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(pattern.frequency === 'weekly' || pattern.frequency === 'biweekly') && (
            <div>
              <Label>Dias da Semana</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <Badge
                    key={day.value}
                    variant={pattern.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDayOfWeek(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {pattern.frequency === 'custom' && (
            <div>
              <Label htmlFor="sessions">Sessões por Ciclo</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                value={pattern.sessionsPerCycle || 1}
                onChange={(e) => setPattern({ 
                  ...pattern, 
                  sessionsPerCycle: parseInt(e.target.value) || 1 
                })}
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Estimativa: ~{getEstimatedSessions()} sessões/mês
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Salvar Frequência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};