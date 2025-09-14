import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Plus } from 'lucide-react';
import { usePatients, Patient } from '@/hooks/usePatients';
import { NewPatientDialog } from '@/components/patients/NewPatientDialog';
import { ArchivedPatientsList } from '@/components/patients/ArchivedPatientsList';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionsCacheProvider } from '@/contexts/SessionsCacheContext';
import { exportPatientsToCsv } from '@/utils/csvExport';
import { useToast } from '@/components/ui/use-toast';

const Patients = () => {
  const { patients, archivedPatients, isLoading, error, archivePatient, unarchivePatient, deletePatient, isArchiving, isUnarchiving, isDeleting } = usePatients();
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientForDialog, setSelectedPatientForDialog] = useState<Patient | null>(null);
  const { toast } = useToast();

  // Handle URL params for opening patient dialog
  useEffect(() => {
    const pid = searchParams.get('pid');
    const shouldOpen = searchParams.get('open') === '1';
    
    if (pid && shouldOpen && (patients.length > 0 || archivedPatients.length > 0)) {
      const patient = [...patients, ...archivedPatients].find(p => p.id === pid);
      if (patient) {
        setSelectedPatientForDialog(patient);
        setDialogOpen(true);
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
    <SessionsCacheProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 md:ml-64 w-full min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">Pacientes</h1>
              <p className="text-muted-foreground">
                Gerencie seus pacientes e acompanhe suas informações
              </p>
            </div>

            <Tabs defaultValue="active" className="w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="active" className="flex-1 sm:flex-none">Ativos ({patients.length})</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1 sm:flex-none">Arquivados ({archivedPatients.length})</TabsTrigger>
                </TabsList>
                <NewPatientDialog>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Novo Paciente
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
                ) : patients.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Nenhum paciente encontrado</CardTitle>
                      <CardDescription>
                        Você ainda não cadastrou nenhum paciente. Clique em "Novo Paciente" para começar.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {patients.map((patient) => (
                      <Card key={patient.id} className="relative w-full">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate">{patient.name}</CardTitle>
                              {patient.nickname && (
                                <CardDescription className="truncate">"{patient.nickname}"</CardDescription>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="flex-shrink-0"
                              onClick={() => {
                                setSelectedPatientForDialog(patient);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tipo:</span>
                              <span className="text-sm truncate max-w-[150px]">{getTherapyTypeLabel(patient.therapy_type)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Frequência:</span>
                              <span className="text-sm truncate max-w-[150px]">{getFrequencyLabel(patient.frequency, patient.custom_frequency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                                {getStatusLabel(patient.status)}
                              </Badge>
                            </div>
                            {patient.whatsapp && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">WhatsApp:</span>
                                <span className="text-sm truncate max-w-[150px]">{patient.whatsapp}</span>
                              </div>
                            )}
                            {patient.email && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Email:</span>
                                <span className="text-sm truncate max-w-[150px]">{patient.email}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived">
                <ArchivedPatientsList
                  archivedPatients={archivedPatients}
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
    </SessionsCacheProvider>
  );
};

export default Patients;