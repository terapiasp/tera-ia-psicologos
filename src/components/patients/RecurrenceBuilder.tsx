
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { RecurrenceRule } from '@/hooks/useRecurringSchedules';
import { format } from 'date-fns';

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
];

export const RecurrenceBuilder = ({ value, onChange, sessionType = 'individual', sessionValue = 80 }: RecurrenceBuilderProps) => {
  const [isEnabled, setIsEnabled] = useState(!!value);
  const [validationError, setValidationError] = useState<string>('');

  const handleToggle = () => {
    if (isEnabled) {
      setIsEnabled(false);
      onChange(undefined);
      setValidationError('');
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
    
    const newRule = { ...value, ...updates };
    
    // Validar regras inteligentes
    const error = validateRule(newRule);
    setValidationError(error);
    
    if (!error) {
      onChange(newRule);
    }
  };

  const validateRule = (rule: RecurrenceRule): string => {
    if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
      return 'Selecione pelo menos um dia da semana';
    }

    // Regra inteligente: para semanal, apenas 1 day por semana
    if (rule.frequency === 'weekly' && rule.daysOfWeek.length > 1) {
      return 'Para frequência semanal, selecione apenas um dia da semana';
    }

    // Regra inteligente: para quinzenal, máximo 1 dia por semana
    if (rule.frequency === 'biweekly' && rule.daysOfWeek.length > 1) {
      return 'Para frequência quinzenal, selecione apenas um dia da semana';
    }

    // Para mensal, pode ter vários dias mas vamos limitar a lógica
    if (rule.frequency === 'monthly' && rule.daysOfWeek.length > 2) {
      return 'Para frequência mensal, selecione no máximo 2 dias';
    }

    return '';
  };

  const toggleDayOfWeek = (day: number) => {
    if (!value) return;
    
    const currentDays = value.daysOfWeek || [];
    let newDays: number[];
    
    if (currentDays.includes(day)) {
      newDays = currentDays.filter(d => d !== day);
    } else {
      // Para semanal e quinzenal, substituir o dia atual
      if (value.frequency === 'weekly' || value.frequency === 'biweekly') {
        newDays = [day];
      } else {
        newDays = [...currentDays, day].sort();
      }
    }
    
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
        return `Todo mês ${days ? `(${days})` : ''} às ${time}`;
      default:
        return '';
    }
  };

  const calculateMonthlyRevenue = () => {
    if (!value || !sessionValue) return 0;
    
    switch (value.frequency) {
      case 'weekly':
        return sessionValue * 4; // 4 semanas por mês
      case 'biweekly':
        return sessionValue * 2; // 2 sessões por mês
      case 'monthly':
        return sessionValue * (value.daysOfWeek?.length || 1); // Dias selecionados no mês
      default:
        return 0;
    }
  };

  if (!isEnabled) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Frequência e Agendamento</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Configurar Frequência
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure a frequência das sessões e agendamento automático
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
            Frequência e Agendamento
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
        {value && !validationError && (
          <Badge variant="secondary" className="text-xs w-fit">
            {getFrequencyDescription()}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequência */}
        <div className="space-y-2">
          <Label className="text-xs">Frequência *</Label>
          <Select 
            value={value?.frequency} 
            onValueChange={(freq) => updateRule({ 
              frequency: freq as any,
              daysOfWeek: freq === 'weekly' || freq === 'biweekly' ? [1] : value?.daysOfWeek || [1]
            })}
          >
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

        {/* Dias da Semana */}
        {value?.frequency && (
          <div className="space-y-2">
            <Label className="text-xs">
              Dias da Semana
              {value.frequency === 'weekly' && <span className="text-muted-foreground"> (máximo 1)</span>}
              {value.frequency === 'biweekly' && <span className="text-muted-foreground"> (máximo 1)</span>}
              {value.frequency === 'monthly' && <span className="text-muted-foreground"> (máximo 2)</span>}
            </Label>
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

        {/* Erro de validação */}
        {validationError && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {validationError}
          </div>
        )}

        {/* Data e Hora */}
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

        {/* Preview e Receita */}
        {value && !validationError && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground">
              {getFrequencyDescription()}
            </p>
            <p className="text-xs text-primary font-medium">
              Receita estimada mensal: R$ {calculateMonthlyRevenue().toFixed(0)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
