import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { RecurrenceRule } from '@/types/frequency';
import { useFrequencyPresets } from '@/hooks/useFrequencyPresets';
import { format, parseISO } from 'date-fns';

interface FrequencySchedulerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  sessionValue?: number;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda-feira' },
  { value: 2, label: 'Ter', fullLabel: 'Terça-feira' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta-feira' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta-feira' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta-feira' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export const FrequencyScheduler = ({ value, onChange, sessionValue = 80, className }: FrequencySchedulerProps) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const { presets, createPreset, isCreating } = useFrequencyPresets();

  const handleFrequencyChange = (frequency: string) => {
    const now = new Date();
    const defaultDate = format(now, 'yyyy-MM-dd');
    const defaultTime = '09:00';

    if (frequency === 'none') {
      onChange(undefined);
      return;
    }

    if (frequency === 'weekly') {
      onChange({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Segunda-feira por padrão
        startDate: defaultDate,
        startTime: defaultTime,
      });
    } else if (frequency === 'biweekly') {
      onChange({
        frequency: 'biweekly',
        interval: 2,
        daysOfWeek: [1], // Segunda-feira por padrão
        startDate: defaultDate,
        startTime: defaultTime,
      });
    } else if (frequency.startsWith('preset-')) {
      const presetId = frequency.replace('preset-', '');
      const preset = presets?.find(p => p.id === presetId);
      if (preset) {
        onChange({
          frequency: 'custom',
          interval: preset.recurrence_pattern.interval,
          daysOfWeek: preset.recurrence_pattern.daysOfWeek || [],
          startDate: defaultDate,
          startTime: defaultTime,
          presetId: preset.id,
          customPattern: preset.recurrence_pattern,
        });
      }
    } else if (frequency === 'custom') {
      setShowCustomDialog(true);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    if (!value) return;

    const currentDays = value.daysOfWeek || [];
    let newDays;

    if (currentDays.includes(dayValue)) {
      newDays = currentDays.filter(d => d !== dayValue);
    } else {
      newDays = [...currentDays, dayValue].sort();
    }

    // Para weekly e biweekly, permitir apenas um dia
    if ((value.frequency === 'weekly' || value.frequency === 'biweekly') && newDays.length > 1) {
      newDays = [dayValue];
    }

    onChange({
      ...value,
      daysOfWeek: newDays,
    });
  };

  const handleDateChange = (date: string) => {
    if (!value) return;
    onChange({ ...value, startDate: date });
  };

  const handleTimeChange = (time: string) => {
    if (!value) return;
    onChange({ ...value, startTime: time });
  };

  const getFrequencyDescription = (): string => {
    if (!value) return '';

    const days = value.daysOfWeek?.map(d => DAYS_OF_WEEK[d].fullLabel).join(', ') || '';
    
    if (value.frequency === 'weekly') {
      return `Toda semana às ${value.startTime || '09:00'} nas ${days}`;
    } else if (value.frequency === 'biweekly') {
      return `A cada duas semanas às ${value.startTime || '09:00'} nas ${days}`;
    } else if (value.frequency === 'custom' && value.customPattern) {
      return value.customPattern.customRule || 'Frequência personalizada';
    }
    
    return '';
  };

  const calculateMonthlyRevenue = (): number => {
    if (!value || !sessionValue) return 0;

    let sessionsPerMonth = 0;
    
    if (value.frequency === 'weekly') {
      sessionsPerMonth = (value.daysOfWeek?.length || 0) * 4.33; // média de semanas por mês
    } else if (value.frequency === 'biweekly') {
      sessionsPerMonth = (value.daysOfWeek?.length || 0) * 2.17; // quinzenal
    } else if (value.frequency === 'custom' && value.customPattern) {
      sessionsPerMonth = value.customPattern.sessionsPerCycle || 0;
    }

    return sessionsPerMonth * sessionValue;
  };

  const currentFrequency = (() => {
    if (!value) return 'none';
    if (value.presetId) return `preset-${value.presetId}`;
    return value.frequency;
  })();

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Seletor de Frequência */}
        <div>
          <Label className="text-sm font-medium">Frequência das Sessões</Label>
          <Select value={currentFrequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="h-12 mt-2">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">🚫 Sem agendamento recorrente</SelectItem>
              <SelectItem value="weekly">📅 Semanal</SelectItem>
              <SelectItem value="biweekly">📆 Quinzenal</SelectItem>
              
              {presets && presets.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t">
                    Frequências Personalizadas
                  </div>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={`preset-${preset.id}`}>
                      ⭐ {preset.name}
                    </SelectItem>
                  ))}
                </>
              )}
              
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar frequência personalizada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Configuração de Dia e Horário */}
        {value && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            {/* Seleção do Dia da Semana */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Dia{value.frequency === 'weekly' || value.frequency === 'biweekly' ? '' : 's'} da Semana
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={value.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                    className="h-8 px-3 text-xs"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              {(value.frequency === 'weekly' || value.frequency === 'biweekly') && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione apenas um dia para sessões {value.frequency === 'weekly' ? 'semanais' : 'quinzenais'}
                </p>
              )}
            </div>

            {/* Data de Início e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data de Início
                </Label>
                <Input
                  type="date"
                  value={value.startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horário
                </Label>
                <Input
                  type="time"
                  value={value.startTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Resumo e Receita Estimada */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{getFrequencyDescription()}</p>
                  <p className="text-muted-foreground">
                    Receita estimada: <span className="font-medium text-foreground">
                      R$ {calculateMonthlyRevenue().toFixed(0)}/mês
                    </span>
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  Configurado
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Frequency Dialog - placeholder for now */}
      {showCustomDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Criar Frequência Personalizada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta funcionalidade será implementada em breve.
            </p>
            <Button onClick={() => setShowCustomDialog(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};