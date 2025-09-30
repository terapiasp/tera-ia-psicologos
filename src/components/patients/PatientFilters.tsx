import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { PatientFilters as PatientFiltersType, SortOption } from '@/hooks/usePatientFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PatientFiltersProps {
  filters: PatientFiltersType;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof PatientFiltersType, value: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  showStatusFilter?: boolean;
}

const filterOptions = {
  status: [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'paused', label: 'Pausado' },
  ],
  therapyTypes: [
    { value: 'individual_adult', label: 'Individual Adulto' },
    { value: 'individual_child', label: 'Individual Infantil' },
    { value: 'individual_teen', label: 'Individual Adolescente' },
    { value: 'couple', label: 'Terapia de Casal' },
    { value: 'family', label: 'Terapia Familiar' },
    { value: 'group', label: 'Terapia em Grupo' },
  ],
  frequencies: [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'custom', label: 'Personalizada' },
  ],
  sessionModes: [
    { value: 'online', label: 'Online' },
    { value: 'in_person', label: 'Presencial' },
    { value: 'hybrid', label: 'Híbrido' },
  ],
  linkStatus: [
    { value: 'configured', label: 'Configurado' },
    { value: 'not_configured', label: 'Não configurado' },
  ],
};

const sortOptions = [
  { value: 'alphabetical' as SortOption, label: 'Ordem Alfabética' },
  { value: 'created_date' as SortOption, label: 'Data de Criação' },
  { value: 'session_date' as SortOption, label: 'Data de Sessão' },
];

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  showStatusFilter = false,
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const handleCheckboxChange = (
    filterKey: keyof PatientFiltersType,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[filterKey] as string[];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    onFilterChange(filterKey, newValues);
  };

  const getActiveFilterCount = (filterKey: keyof PatientFiltersType) => {
    const values = filters[filterKey];
    return Array.isArray(values) ? values.length : 0;
  };

  const FilterPopover = ({
    filterKey,
    label,
    options,
  }: {
    filterKey: keyof PatientFiltersType;
    label: string;
    options: Array<{ value: string; label: string }>;
  }) => {
    const activeCount = getActiveFilterCount(filterKey);
    const isOpen = openPopover === filterKey;

    return (
      <Popover open={isOpen} onOpenChange={(open) => setOpenPopover(open ? filterKey : null)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-dashed"
          >
            {label}
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {activeCount}
              </Badge>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-2">
              {options.map((option) => {
                const checked = (filters[filterKey] as string[]).includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterKey}-${option.value}`}
                      checked={checked}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(filterKey, option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${filterKey}-${option.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, apelido, WhatsApp ou email..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sort and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Sort Selector */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange('sortBy', value as SortOption)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros:</span>
          </div>

        {showStatusFilter && (
          <FilterPopover
            filterKey="status"
            label="Status"
            options={filterOptions.status}
          />
        )}

        <FilterPopover
          filterKey="therapyTypes"
          label="Tipo de Terapia"
          options={filterOptions.therapyTypes}
        />

        <FilterPopover
          filterKey="frequencies"
          label="Frequência"
          options={filterOptions.frequencies}
        />

        <FilterPopover
          filterKey="sessionModes"
          label="Modalidade"
          options={filterOptions.sessionModes}
        />

        <FilterPopover
          filterKey="linkStatus"
          label="Link de Sessão"
          options={filterOptions.linkStatus}
        />

          {hasActiveFilters && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="default"
                size="sm"
                onClick={onClearFilters}
                className="h-9 px-3 lg:px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
              >
                Limpar filtros
                <X className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};