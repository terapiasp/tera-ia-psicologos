import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit, Plus, Search, ArrowUpDown, Filter, Archive, X } from 'lucide-react';
import { usePatients, Patient } from '@/hooks/usePatients';
import { usePatientFilters } from '@/hooks/usePatientFilters';
import { NewPatientDialog } from '@/components/patients/NewPatientDialog';
import { ArchivedPatientsList } from '@/components/patients/ArchivedPatientsList';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SortOption } from '@/hooks/usePatientFilters';

import { exportPatientsToCsv } from '@/utils/csvExport';
import { useToast } from '@/components/ui/use-toast';
import SessionLinkStatus from '@/components/patients/SessionLinkStatus';

const filterOptions = {
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
  status: [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'paused', label: 'Pausado' },
  ],
};

const sortOptions = [
  { value: 'alphabetical' as SortOption, label: 'A-Z' },
  { value: 'created_date' as SortOption, label: 'Mais Recentes' },
  { value: 'session_date' as SortOption, label: 'Próxima Sessão' },
];

const Patients = () => {
  const { patients, archivedPatients, isLoading, archivePatient, unarchivePatient, deletePatient, isUnarchiving, isDeleting } = usePatients();
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientForDialog, setSelectedPatientForDialog] = useState<Patient | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [openFilterPopover, setOpenFilterPopover] = useState(false);
  const { toast } = useToast();
  
  // Estados para controlar expansão dos cards do mosaico
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSortExpanded, setIsSortExpanded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

  // Single persistent filter state
  const allPatients = showArchived ? archivedPatients : patients;
  const sharedFilters = usePatientFilters(allPatients);

  // Handle URL params for opening patient dialog
  useEffect(() => {
    const pid = searchParams.get('pid');
    const shouldOpen = searchParams.get('open') === '1';
    const section = searchParams.get('section');
    
    if (pid && shouldOpen && (patients.length > 0 || archivedPatients.length > 0)) {
      const patient = [...patients, ...archivedPatients].find(p => p.id === pid);
      if (patient) {
        setSelectedPatientForDialog(patient);
        setDialogOpen(true);
        
        if (section) {
          window.sessionStorage.setItem('scrollToSection', section);
        }
      }
    }
  }, [searchParams, patients, archivedPatients]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPatientForDialog(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('pid');
    newParams.delete('open');
    newParams.delete('section');
    setSearchParams(newParams);
    window.sessionStorage.removeItem('scrollToSection');
  };

  const getTherapyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'individual_adult': 'Individual Adulto',
      'individual_child': 'Individual Infantil',
      'individual_teen': 'Individual Adolescente',
      'couple': 'Terapia de Casal',
      'family': 'Terapia Familiar',
      'group': 'Terapia em Grupo'
    };
    return types[type] || type;
  };

  const getFrequencyLabel = (frequency: string, customFrequency?: string) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quinzenal';
      case 'monthly': return 'Mensal';
      case 'custom': return customFrequency || 'Personalizada';
      default: return frequency;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'paused': return 'Pausado';
      default: return status;
    }
  };
  
  const getTotalActiveFilters = () => {
    const { filters } = sharedFilters;
    return filters.status.length +
           filters.therapyTypes.length +
           filters.frequencies.length +
           filters.sessionModes.length +
           filters.linkStatus.length;
  };

  const handleCheckboxChange = (
    filterKey: 'status' | 'therapyTypes' | 'frequencies' | 'sessionModes' | 'linkStatus',
    value: string,
    checked: boolean
  ) => {
    const currentValues = sharedFilters.filters[filterKey] as string[];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    sharedFilters.updateFilter(filterKey, newValues);
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(archivedPatients.map(p => p.id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleExportSelected = () => {
    const selectedData = archivedPatients.filter(p => selectedPatients.includes(p.id));
    if (selectedData.length === 0) {
      toast({
        title: "Nenhum paciente selecionado",
        description: "Selecione pelo menos um paciente para exportar.",
        variant: "destructive",
      });
      return;
    }
    exportPatientsToCsv(selectedData);
    toast({
      title: "Exportação concluída",
      description: `${selectedData.length} paciente(s) exportado(s) com sucesso.`,
    });
  };

  const handleExportAll = () => {
    exportPatientsToCsv(archivedPatients, 'todos-pacientes-arquivados.csv');
    toast({
      title: "Exportação concluída",
      description: `${archivedPatients.length} paciente(s) exportado(s) com sucesso.`,
    });
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient(patientId);
    setSelectedPatients(prev => prev.filter(id => id !== patientId));
  };

  const totalActiveFilters = getTotalActiveFilters();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 md:ml-64 w-full min-w-0 space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Pacientes</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie seus pacientes e acompanhe suas informações
            </p>
          </div>

          {/* Mosaico de Controles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Busca */}
            <Collapsible open={isSearchExpanded} onOpenChange={setIsSearchExpanded}>
              <Card className="col-span-2 md:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <CardTitle className="text-sm md:text-base">Buscar</CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    <div className="relative">
                      <Input
                        placeholder="Nome, apelido..."
                        value={sharedFilters.filters.search}
                        onChange={(e) => sharedFilters.handleSearchChange(e.target.value)}
                        className="h-9 text-sm pr-8"
                      />
                      {sharedFilters.filters.search && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-9 w-8"
                          onClick={() => sharedFilters.handleSearchChange('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* 2. Ordenar */}
            <Collapsible open={isSortExpanded} onOpenChange={setIsSortExpanded}>
              <Card className="col-span-2 md:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <CardTitle className="text-sm md:text-base">Ordenar</CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    <Select
                      value={sharedFilters.filters.sortBy}
                      onValueChange={(value) => sharedFilters.updateFilter('sortBy', value as SortOption)}
                    >
                      <SelectTrigger className="h-9 text-sm">
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
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* 3. Filtros */}
            <Collapsible open={isFilterExpanded} onOpenChange={setIsFilterExpanded}>
              <Card className="col-span-2 md:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <CardTitle className="text-sm md:text-base">Filtros</CardTitle>
                      </div>
                      {totalActiveFilters > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {totalActiveFilters}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="max-h-[400px] pr-4">
                      <div className="p-2 space-y-4">
                        {/* Status Filter */}
                        {!showArchived && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Status</Label>
                            {filterOptions.status.map((option) => {
                              const checked = (sharedFilters.filters.status as string[]).includes(option.value);
                              return (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`status-${option.value}`}
                                    checked={checked}
                                    onCheckedChange={(checked) =>
                                      handleCheckboxChange('status', option.value, checked as boolean)
                                    }
                                  />
                                  <Label
                                    htmlFor={`status-${option.value}`}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Therapy Types */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Tipo de Terapia</Label>
                          {filterOptions.therapyTypes.map((option) => {
                            const checked = (sharedFilters.filters.therapyTypes as string[]).includes(option.value);
                            return (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`therapy-${option.value}`}
                                  checked={checked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange('therapyTypes', option.value, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`therapy-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>

                        {/* Frequencies */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Frequência</Label>
                          {filterOptions.frequencies.map((option) => {
                            const checked = (sharedFilters.filters.frequencies as string[]).includes(option.value);
                            return (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`freq-${option.value}`}
                                  checked={checked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange('frequencies', option.value, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`freq-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>

                        {/* Session Modes */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Modalidade</Label>
                          {filterOptions.sessionModes.map((option) => {
                            const checked = (sharedFilters.filters.sessionModes as string[]).includes(option.value);
                            return (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`mode-${option.value}`}
                                  checked={checked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange('sessionModes', option.value, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`mode-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>

                        {/* Link Status */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Link de Sessão</Label>
                          {filterOptions.linkStatus.map((option) => {
                            const checked = (sharedFilters.filters.linkStatus as string[]).includes(option.value);
                            return (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`link-${option.value}`}
                                  checked={checked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange('linkStatus', option.value, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`link-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>

                        {totalActiveFilters > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              sharedFilters.clearFilters();
                            }}
                            className="w-full"
                          >
                            Limpar Filtros
                          </Button>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* 4. Arquivados */}
            <Collapsible open={isArchivedExpanded} onOpenChange={setIsArchivedExpanded}>
              <Card className="col-span-2 md:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <CardTitle className="text-sm md:text-base">Arquivados</CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-archived" className="text-sm cursor-pointer">
                        {showArchived ? 'Mostrando' : 'Ocultos'}
                      </Label>
                      <Switch
                        id="show-archived"
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                      />
                    </div>
                    {showArchived && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {archivedPatients.length} arquivado(s)
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Botão Novo Paciente */}
          <div className="flex justify-end">
            <NewPatientDialog>
              <Button className="gap-2 w-full md:w-auto">
                <Plus className="h-4 w-4" />
                <span className="md:hidden">Novo</span>
                <span className="hidden md:inline">Novo Paciente</span>
              </Button>
            </NewPatientDialog>
          </div>

          {/* Lista de Pacientes */}
          {showArchived ? (
            <ArchivedPatientsList
              archivedPatients={sharedFilters.filteredPatients}
              selectedPatients={selectedPatients}
              onSelectPatient={handleSelectPatient}
              onSelectAll={handleSelectAll}
              onExportSelected={handleExportSelected}
              onExportAll={handleExportAll}
              onUnarchivePatient={unarchivePatient}
              onDeletePatient={handleDeletePatient}
              isUnarchiving={isUnarchiving}
              isDeleting={isDeleting}
            />
          ) : (
            <>
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="p-4 md:p-6">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </CardHeader>
                      <CardContent className="p-4 md:p-6 pt-0">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[180px]" />
                          <Skeleton className="h-4 w-[160px]" />
                          <Skeleton className="h-4 w-[140px]" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sharedFilters.filteredPatients.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Nenhum paciente encontrado</CardTitle>
                    <CardDescription>
                      {sharedFilters.hasActiveFilters
                        ? 'Nenhum paciente corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
                        : 'Você ainda não cadastrou nenhum paciente. Clique em "Novo Paciente" para começar.'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedFilters.filteredPatients.map((patient) => (
                    <Card key={patient.id} className="relative w-full">
                      <CardHeader className="p-4 md:p-6">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base md:text-lg truncate">{patient.name}</CardTitle>
                            {patient.nickname && (
                              <CardDescription className="text-xs md:text-sm truncate">"{patient.nickname}"</CardDescription>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10"
                            onClick={() => {
                              setSelectedPatientForDialog(patient);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between gap-2">
                            <span className="text-xs md:text-sm text-muted-foreground">Tipo:</span>
                            <span className="text-xs md:text-sm truncate max-w-[60%]">{getTherapyTypeLabel(patient.therapy_type)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-xs md:text-sm text-muted-foreground">Frequência:</span>
                            <span className="text-xs md:text-sm truncate max-w-[60%]">{getFrequencyLabel(patient.frequency, patient.custom_frequency)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-xs md:text-sm text-muted-foreground">Status:</span>
                            <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {getStatusLabel(patient.status)}
                            </Badge>
                          </div>
                          {patient.whatsapp && (
                            <div className="flex justify-between gap-2">
                              <span className="text-xs md:text-sm text-muted-foreground">WhatsApp:</span>
                              <span className="text-xs md:text-sm truncate max-w-[60%]">{patient.whatsapp}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex justify-between gap-2">
                              <span className="text-xs md:text-sm text-muted-foreground">Email:</span>
                              <span className="text-xs md:text-sm truncate max-w-[60%]">{patient.email}</span>
                            </div>
                          )}
                          <SessionLinkStatus patient={patient} compact={true} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Controlled Patient Dialog */}
      {selectedPatientForDialog && (
        <NewPatientDialog 
          patient={selectedPatientForDialog} 
          isEdit={true}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        >
          <div />
        </NewPatientDialog>
      )}
    </div>
  );
};

export default Patients;
