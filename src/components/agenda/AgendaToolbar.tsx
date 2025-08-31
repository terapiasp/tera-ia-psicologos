import React from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Filter, Users, CalendarCheck } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaToolbarProps {
  viewMode: 'week' | 'timeline';
  onViewModeChange: (mode: 'week' | 'timeline') => void;
  currentWeek?: Date;
  onWeekChange?: (week: Date) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  patientFilter?: string;
  onPatientFilterChange?: (patientId: string) => void;
  patients?: Array<{ id: string; name: string; nickname?: string }>;
  sessionsCount?: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
}

export const AgendaToolbar: React.FC<AgendaToolbarProps> = ({
  viewMode,
  onViewModeChange,
  currentWeek,
  onWeekChange,
  statusFilter = 'all',
  onStatusFilterChange,
  patientFilter = 'all',
  onPatientFilterChange,
  patients = [],
  sessionsCount = { total: 0, scheduled: 0, completed: 0, cancelled: 0 }
}) => {
  const weekStart = currentWeek ? startOfWeek(currentWeek, { weekStartsOn: 1 }) : null;
  const weekEnd = currentWeek ? endOfWeek(currentWeek, { weekStartsOn: 1 }) : null;

  const goToPreviousWeek = () => {
    if (currentWeek && onWeekChange) {
      onWeekChange(subWeeks(currentWeek, 1));
    }
  };

  const goToNextWeek = () => {
    if (currentWeek && onWeekChange) {
      onWeekChange(addWeeks(currentWeek, 1));
    }
  };

  const goToCurrentWeek = () => {
    if (onWeekChange) {
      onWeekChange(new Date());
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4 space-y-4">
      {/* Linha principal - Navegação e Toggle de Visualização */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Navegação da semana - só mostra na view de semana */}
        {viewMode === 'week' && weekStart && weekEnd && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-8 px-3 text-xs font-medium hover:bg-muted"
              >
                Hoje
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        )}

        {/* Timeline info - só mostra na view de timeline */}
        {viewMode === 'timeline' && (
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Linha do Tempo</span>
            {sessionsCount.total > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {sessionsCount.total} sessões
                </Badge>
                <Badge variant="outline" className="text-xs text-primary">
                  {sessionsCount.scheduled} agendadas
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Toggle de visualização */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(newValue) => {
            if (newValue) onViewModeChange(newValue as 'week' | 'timeline');
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
      </div>

      {/* Segunda linha - Filtros (só mostra na timeline) */}
      {viewMode === 'timeline' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros:</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Filtro por status */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Agendadas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por paciente */}
            <Select value={patientFilter} onValueChange={onPatientFilterChange}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacientes</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.nickname || patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Contador de filtros ativos */}
            {(statusFilter !== 'all' || patientFilter !== 'all') && (
              <Badge variant="outline" className="text-xs">
                {[statusFilter !== 'all', patientFilter !== 'all'].filter(Boolean).length} filtros ativos
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};