import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock } from 'lucide-react';
import { RecurrenceRule } from '@/hooks/useRecurringSchedules';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecurrenceBuilderProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  sessionType?: string;
  sessionValue?: number;
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

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizado' },
];

export const RecurrenceBuilder = ({ value, onChange, sessionType = 'individual', sessionValue }: RecurrenceBuilderProps) => {
  const [isEnabled, setIsEnabled] = useState(!!value);

  const handleToggle = () => {
    if (isEnabled) {
      setIsEnabled(false);
      onChange(undefined);
    } else {
      setIsEnabled(true);
      // Criar regra padrão
      const defaultRule: RecurrenceRule = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Segunda-feira
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
      };
      onChange(defaultRule);
    }
  };

  const updateRule = (updates: Partial<RecurrenceRule>) => {
    if (!value) return;
    onChange({ ...value, ...updates });
  };

  const toggleDayOfWeek = (day: number) => {
    if (!value) return;
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    updateRule({ daysOfWeek: newDays });
  };

  const getFrequencyDescription = () => {
    if (!value) return '';
    
    const days = value.daysOfWeek?.map(d => DAYS_OF_WEEK[d].label).join(', ') || '';
    const time = value.startTime;
    
    switch (value.frequency) {
      case 'weekly':
        return `Toda semana ${days ? `(${days})` : ''} às ${time}`;
      case 'biweekly':
        return `A cada duas semanas ${days ? `(${days})` : ''} às ${time}`;
      case 'monthly':
        return `Todo mês no dia ${format(new Date(value.startDate), 'd')} às ${time}`;
      case 'custom':
        return `A cada ${value.interval} dia${value.interval > 1 ? 's' : ''} ${days ? `(${days})` : ''} às ${time}`;
      default:
        return '';
    }
  };

  if (!isEnabled) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Agendamento Recorrente</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Configurar Recorrência
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure um agendamento recorrente para sessões regulares do paciente
        </p>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Agendamento Recorrente
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        {value && (
          <Badge variant="secondary" className="text-xs w-fit">
            {getFrequencyDescription()}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequência */}
        <div className="space-y-2">
          <Label className="text-xs">Frequência</Label>
          <Select value={value?.frequency} onValueChange={(freq) => updateRule({ frequency: freq as any })}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intervalo customizado */}
        {value?.frequency === 'custom' && (
          <div className="space-y-2">
            <Label className="text-xs">Intervalo (dias)</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={value.interval}
              onChange={(e) => updateRule({ interval: parseInt(e.target.value) || 1 })}
              className="h-8"
            />
          </div>
        )}

        {/* Dias da semana (para semanal, quinzenal e custom) */}
        {(value?.frequency === 'weekly' || value?.frequency === 'biweekly' || value?.frequency === 'custom') && (
          <div className="space-y-2">
            <Label className="text-xs">Dias da Semana</Label>
            <div className="flex flex-wrap gap-1">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOfWeek(day.value)}
                  className={`
                    px-2 py-1 text-xs rounded-md border transition-colors
                    ${value?.daysOfWeek?.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data de início */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs">Data de Início</Label>
            <Input
              type="date"
              value={value?.startDate}
              onChange={(e) => updateRule({ startDate: e.target.value })}
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Horário
            </Label>
            <Input
              type="time"
              value={value?.startTime}
              onChange={(e) => updateRule({ startTime: e.target.value })}
              className="h-8"
            />
          </div>
        </div>

        {/* Preview */}
        {value && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {getFrequencyDescription()}
            </p>
            {sessionValue && (
              <p className="text-xs text-primary font-medium mt-1">
                Receita estimada mensal: R$ {(sessionValue * 4).toFixed(0)}/mês
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};