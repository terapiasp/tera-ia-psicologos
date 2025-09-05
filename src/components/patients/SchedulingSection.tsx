import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeInput } from './TimeInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, RotateCcw } from 'lucide-react';
import { RecurrenceRule } from '@/types/frequency';
import { countNextMonth } from '@/utils/recurrence';
import { format, parseISO } from 'date-fns';

interface SchedulingSectionProps {
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

export const SchedulingSection = ({ value, onChange, sessionValue = 80, className }: SchedulingSectionProps) => {
  const [schedulingMode, setSchedulingMode] = useState<'single' | 'recurring'>(
    value ? 'recurring' : 'single'
  );
  
  // Local states for single session mode
  const [singleDate, setSingleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [singleTime, setSingleTime] = useState('09:00');

  // Sync mode with external value when editing existing data
  useEffect(() => {
    setSchedulingMode(value ? 'recurring' : 'single');
  }, [value]);

  // Sync single states with value when switching modes
  useEffect(() => {
    if (value) {
      setSingleDate(value.startDate);
      setSingleTime(value.startTime);
    }
  }, [value]);

  const handleModeChange = (mode: 'single' | 'recurring') => {
    setSchedulingMode(mode);
    
    if (mode === 'single') {
      // Clear recurring rule and preserve current values in local state
      onChange(undefined);
    } else {
      // Create basic recurring rule using current single values
      onChange({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday by default
        startDate: singleDate,
        startTime: singleTime,
      });
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    if (!value) return;
    
    const newRule: RecurrenceRule = {
      ...value,
      frequency: frequency as 'weekly' | 'biweekly' | 'custom',
    };

    if (frequency === 'weekly') {
      newRule.interval = 1;
      // Keep only first selected day for weekly
      if (newRule.daysOfWeek.length > 1) {
        newRule.daysOfWeek = [newRule.daysOfWeek[0]];
      }
    } else if (frequency === 'biweekly') {
      newRule.interval = 2;
      // Keep only first selected day for biweekly
      if (newRule.daysOfWeek.length > 1) {
        newRule.daysOfWeek = [newRule.daysOfWeek[0]];
      }
    }

    onChange(newRule);
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

    // For weekly and biweekly, allow only one day
    if ((value.frequency === 'weekly' || value.frequency === 'biweekly') && newDays.length > 1) {
      newDays = [dayValue];
    }

    onChange({
      ...value,
      daysOfWeek: newDays,
    });
  };

  const handleDateChange = (date: string) => {
    if (schedulingMode === 'single') {
      setSingleDate(date);
    } else {
      if (!value) return;
      onChange({ ...value, startDate: date });
    }
  };

  const handleTimeChange = (time: string) => {
    if (schedulingMode === 'single') {
      setSingleTime(time);
    } else {
      if (!value) return;
      onChange({ ...value, startTime: time });
    }
  };

  const getFrequencyDescription = (): string => {
    if (schedulingMode === 'single') {
      return 'Sessão única agendada';
    }
    
    if (!value) return '';

    const days = value.daysOfWeek?.map(d => DAYS_OF_WEEK[d].fullLabel).join(', ') || '';
    
    if (value.frequency === 'weekly') {
      return `Toda semana às ${value.startTime || '09:00'} nas ${days}`;
    } else if (value.frequency === 'biweekly') {
      return `A cada duas semanas às ${value.startTime || '09:00'} nas ${days}`;
    } else if (value.frequency === 'custom') {
      return 'Frequência personalizada configurada';
    }
    
    return '';
  };

  const calculateMonthlyRevenue = (): number => {
    if (schedulingMode === 'single') {
      return sessionValue; // Just one session
    }
    
    if (!value || !sessionValue) return 0;

    try {
      const sessionsNextMonth = countNextMonth(value);
      return sessionsNextMonth * sessionValue;
    } catch (error) {
      console.error('Error calculating monthly revenue:', error);
      return 0;
    }
  };

  const currentDate = schedulingMode === 'single' ? singleDate : (value?.startDate || format(new Date(), 'yyyy-MM-dd'));
  const currentTime = schedulingMode === 'single' ? singleTime : (value?.startTime || '09:00');

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Tipo de Agendamento</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={schedulingMode === 'single' ? 'default' : 'outline'}
              onClick={() => handleModeChange('single')}
              className="flex-1 h-12"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Sessão Única
            </Button>
            <Button
              type="button"
              variant={schedulingMode === 'recurring' ? 'default' : 'outline'}
              onClick={() => handleModeChange('recurring')}
              className="flex-1 h-12"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Sessão Recorrente
            </Button>
          </div>
        </div>

        {/* Date and Time - Always visible */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Calendar className="h-4 w-4 inline mr-1" />
              {schedulingMode === 'single' ? 'Data da Sessão' : 'Data de Início'}
            </Label>
            <Input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-12"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Clock className="h-4 w-4 inline mr-1" />
              Horário
            </Label>
            <TimeInput
              value={currentTime}
              onChange={handleTimeChange}
              className="h-12"
            />
          </div>
        </div>

        {/* Recurring Options - Only when recurring mode is selected */}
        {schedulingMode === 'recurring' && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            {/* Frequency Selector */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Frequência</Label>
              <Select 
                value={value?.frequency || 'weekly'} 
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">📅 Semanal</SelectItem>
                  <SelectItem value="biweekly">📆 Quinzenal</SelectItem>
                  <SelectItem value="custom">⚙️ Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day Selection */}
            {value && (
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
            )}
          </div>
        )}

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-foreground">{getFrequencyDescription()}</p>
              <p className="text-muted-foreground">
                Receita estimada no próximo mês: <span className="font-medium text-foreground">
                  R$ {calculateMonthlyRevenue().toFixed(0)}
                </span>
              </p>
            </div>
            <Badge variant="secondary" className="ml-2">
              {schedulingMode === 'single' ? 'Única' : 'Recorrente'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
