import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Plus } from 'lucide-react';
import { usePatients, Patient } from '@/hooks/usePatients';
import { usePatientFilters } from '@/hooks/usePatientFilters';
import { NewPatientDialog } from '@/components/patients/NewPatientDialog';
import { ArchivedPatientsList } from '@/components/patients/ArchivedPatientsList';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

import { exportPatientsToCsv } from '@/utils/csvExport';
import { useToast } from '@/components/ui/use-toast';
import SessionLinkStatus from '@/components/patients/SessionLinkStatus';

const Patients = () => {
  const { patients, archivedPatients, isLoading, error, archivePatient, unarchivePatient, deletePatient, isArchiving, isUnarchiving, isDeleting } = usePatients();
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientForDialog, setSelectedPatientForDialog] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  // Single persistent filter state - applies to whichever tab is active
  const allPatients = activeTab === 'active' ? patients : archivedPatients;
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
        
        // Se tem seção especificada, guardar para usar no dialog
        if (section) {
          // Passar o parâmetro de seção para o dialog via state global ou prop
          window.sessionStorage.setItem('scrollToSection', section);
        }
      }
    }
  }, [searchParams, patients, archivedPatients]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPatientForDialog(null);
    // Clear URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('pid');
    newParams.delete('open');
    newParams.delete('section');
    setSearchParams(newParams);
    // Clear session storage
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

            {/* Filters Section */}
            <div>
              <PatientFilters
                filters={sharedFilters.filters}
                onSearchChange={sharedFilters.handleSearchChange}
                onFilterChange={sharedFilters.updateFilter}
                onClearFilters={sharedFilters.clearFilters}
                hasActiveFilters={sharedFilters.hasActiveFilters}
                showStatusFilter={activeTab === 'active'}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex h-auto bg-transparent md:bg-muted p-0 md:p-1">
                  <TabsTrigger 
                    value="active" 
                    className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm"
                  >
                    <span className="md:hidden">Ativos</span>
                    <span className="hidden md:inline">Ativos ({activeTab === 'active' ? sharedFilters.filteredPatients.length : patients.length})</span>
                    <span className="md:hidden text-[10px] text-muted-foreground">({activeTab === 'active' ? sharedFilters.filteredPatients.length : patients.length})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="archived"
                    className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm"
                  >
                    <span className="md:hidden">Arquiv.</span>
                    <span className="hidden md:inline">Arquivados ({activeTab === 'archived' ? sharedFilters.filteredPatients.length : archivedPatients.length})</span>
                    <span className="md:hidden text-[10px] text-muted-foreground">({activeTab === 'archived' ? sharedFilters.filteredPatients.length : archivedPatients.length})</span>
                  </TabsTrigger>
                </TabsList>
                <NewPatientDialog>
                  <Button className="gap-2 w-full md:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="md:hidden">Novo</span>
                    <span className="hidden md:inline">Novo Paciente</span>
                  </Button>
                </NewPatientDialog>
              </div>

              <TabsContent value="active">
                {isLoading ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </CardHeader>
                        <CardContent>
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
              </TabsContent>

              <TabsContent value="archived">
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
              </TabsContent>
            </Tabs>
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