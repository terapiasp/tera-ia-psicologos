
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock, AlertCircle, Plus } from 'lucide-react';
import { RecurrenceRule } from '@/types/frequency';
import { useFrequencyPresets } from '@/hooks/useFrequencyPresets';
import { CustomFrequencyDialog } from './CustomFrequencyDialog';
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

export const RecurrenceBuilder = ({ value, onChange, sessionType = 'individual', sessionValue = 80 }: RecurrenceBuilderProps) => {
  const [isEnabled, setIsEnabled] = useState(!!value);
  const [validationError, setValidationError] = useState<string>('');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const { presets, createPreset, isCreating } = useFrequencyPresets();

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

    // Regra inteligente: para semanal, apenas 1 dia por semana
    if (rule.frequency === 'weekly' && rule.daysOfWeek.length > 1) {
      return 'Para frequência semanal, selecione apenas um dia da semana';
    }

    // Regra inteligente: para quinzenal, máximo 1 dia por semana
    if (rule.frequency === 'biweekly' && rule.daysOfWeek.length > 1) {
      return 'Para frequência quinzenal, selecione apenas um dia da semana';
    }

    if (rule.frequency === 'custom' && (!rule.customPattern || rule.daysOfWeek.length === 0)) {
      return 'Frequência personalizada deve ter configuração válida';
    }

    return '';
  };

  const handleCustomFrequencyCreated = ({ name, pattern }: { name: string; pattern: any }) => {
    createPreset({
      name,
      recurrence_pattern: pattern,
      estimated_sessions_per_month: calculateMonthlyRevenue(pattern, sessionValue) || 4,
    });

    // Apply the custom frequency to current rule
    const newRule: RecurrenceRule = {
      frequency: 'custom',
      interval: pattern.interval,
      daysOfWeek: pattern.daysOfWeek || [],
      startDate: value?.startDate || new Date().toISOString().split('T')[0],
      startTime: value?.startTime || '09:00',
      presetId: '', // Will be set after creation
      customPattern: pattern,
    };
    
    updateRule(newRule);
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
        // For custom frequencies, add the day
        newDays = [...currentDays, day].sort();
      }
    }
    
    updateRule({ daysOfWeek: newDays });
  };

  const getFrequencyDescription = () => {
    if (!value) return '';
    
    const days = value.daysOfWeek?.map(d => DAYS_OF_WEEK[d].label).join(', ') || '';
    const time = value.startTime;
    
    if (value.frequency === 'custom' && value.customPattern) {
      // Find the preset name if available
      const preset = presets.find(p => p.id === value.presetId);
      const presetName = preset?.name || 'Personalizada';
      return `${presetName} ${days ? `(${days})` : ''} às ${time}`;
    }
    
    switch (value.frequency) {
      case 'weekly':
        return `Toda semana ${days ? `(${days})` : ''} às ${time}`;
      case 'biweekly':
        return `A cada duas semanas ${days ? `(${days})` : ''} às ${time}`;
      default:
        return '';
    }
  };

  const calculateMonthlyRevenue = (rule?: RecurrenceRule | any, sessionVal?: number): number => {
    const ruleToUse = rule || value;
    const valueToUse = sessionVal || sessionValue;
    
    if (!ruleToUse || !valueToUse) return 0;
    
    // Handle both RecurrenceRule and RecurrencePattern
    const pattern = ruleToUse.customPattern || ruleToUse;
    
    let sessionsPerMonth = 0;
    
    switch (pattern.frequency) {
      case 'weekly':
        sessionsPerMonth = (pattern.daysOfWeek?.length || 1) * 4;
        break;
      case 'biweekly':
        sessionsPerMonth = (pattern.daysOfWeek?.length || 1) * 2;
        break;
      case 'monthly':
        sessionsPerMonth = pattern.daysOfMonth?.length || pattern.sessionsPerCycle || 1;
        break;
      case 'custom':
        sessionsPerMonth = pattern.sessionsPerCycle || 4;
        break;
    }
    
    return sessionsPerMonth * valueToUse;
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
    <>
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
              onValueChange={(freq: 'weekly' | 'biweekly' | 'custom') => {
                if (freq === 'custom') {
                  setShowCustomDialog(true);
                } else {
                  updateRule({ 
                    frequency: freq,
                    daysOfWeek: [1], // Default to Monday
                    customPattern: undefined,
                    presetId: undefined
                  });
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    Frequência Personalizada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dias da Semana */}
          {value?.frequency && (value.frequency === 'weekly' || value.frequency === 'biweekly' || 
            (value.frequency === 'custom' && value.customPattern?.frequency !== 'monthly')) && (
            <div className="space-y-2">
              <Label className="text-xs">
                Dias da Semana
                {value.frequency === 'weekly' && <span className="text-muted-foreground"> (máximo 1)</span>}
                {value.frequency === 'biweekly' && <span className="text-muted-foreground"> (máximo 1)</span>}
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
      
      <CustomFrequencyDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onSave={handleCustomFrequencyCreated}
      />
    </>
  );
};
