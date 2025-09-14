import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2, Download } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsCompact } from '@/hooks/useIsCompact';

interface ArchivedPatientsListProps {
  archivedPatients: Patient[];
  selectedPatients: string[];
  onSelectPatient: (patientId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onExportSelected: () => void;
  onExportAll: () => void;
  onUnarchivePatient: (patientId: string) => void;
  onDeletePatient: (patientId: string) => void;
  isUnarchiving: boolean;
  isDeleting: boolean;
}

export const ArchivedPatientsList: React.FC<ArchivedPatientsListProps> = ({
  archivedPatients,
  selectedPatients,
  onSelectPatient,
  onSelectAll,
  onExportSelected,
  onExportAll,
  onUnarchivePatient,
  onDeletePatient,
  isUnarchiving,
  isDeleting,
}) => {
  const isMobile = useIsMobile();
  const isCompact = useIsCompact();

  if (archivedPatients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum paciente arquivado</CardTitle>
          <CardDescription>
            Quando você arquivar pacientes, eles aparecerão aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ExportButtons = () => (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <Button 
        variant="outline" 
        onClick={onExportSelected}
        disabled={selectedPatients.length === 0}
        className="gap-2 w-full sm:w-auto"
        size={isMobile ? "sm" : "default"}
      >
        <Download className="h-4 w-4" />
        <span className="truncate">Exportar Selecionados ({selectedPatients.length})</span>
      </Button>
      <Button 
        variant="outline" 
        onClick={onExportAll}
        className="gap-2 w-full sm:w-auto"
        size={isMobile ? "sm" : "default"}
      >
        <Download className="h-4 w-4" />
        Exportar Todos
      </Button>
    </div>
  );

  // Mobile/Tablet Card View
  if (isCompact) {
    return (
      <div className="space-y-4">
        <ExportButtons />
        
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pacientes Arquivados</CardTitle>
                <CardDescription>
                  Gerencie pacientes arquivados e exporte dados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPatients.length === archivedPatients.length}
                  onCheckedChange={onSelectAll}
                />
                <span className="text-sm text-muted-foreground">Todos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {archivedPatients.map((patient) => (
              <Card key={patient.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedPatients.includes(patient.id)}
                      onCheckedChange={(checked) => onSelectPatient(patient.id, checked as boolean)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate">{patient.name}</h4>
                          {patient.nickname && (
                            <p className="text-sm text-muted-foreground truncate">"{patient.nickname}"</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUnarchivePatient(patient.id)}
                            disabled={isUnarchiving}
                            title="Reativar paciente"
                            className="h-8 w-8"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isDeleting}
                                title="Deletar permanentemente"
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar paciente permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>⚠️ ATENÇÃO:</strong> Esta ação não pode ser desfeita. Todos os dados do paciente "{patient.name}" serão removidos permanentemente, incluindo:
                                  <br />• Histórico de sessões
                                  <br />• Agendamentos recorrentes
                                  <br />• Anotações e prontuários
                                  <br />• Todas as informações pessoais
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeletePatient(patient.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {patient.whatsapp && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">WhatsApp:</span>
                            <span className="truncate max-w-[150px]">{patient.whatsapp}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Arquivado em:</span>
                          <span>
                            {patient.archived_at ? new Date(patient.archived_at).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="space-y-4">
      <ExportButtons />
      
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Arquivados</CardTitle>
          <CardDescription>
            Gerencie pacientes arquivados e exporte dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPatients.length === archivedPatients.length}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Arquivado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPatients.includes(patient.id)}
                      onCheckedChange={(checked) => onSelectPatient(patient.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      {patient.nickname && (
                        <div className="text-sm text-muted-foreground">"{patient.nickname}"</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{patient.whatsapp}</TableCell>
                  <TableCell>
                    {patient.archived_at ? new Date(patient.archived_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUnarchivePatient(patient.id)}
                        disabled={isUnarchiving}
                        title="Reativar paciente"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting}
                            title="Deletar permanentemente"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar paciente permanentemente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>⚠️ ATENÇÃO:</strong> Esta ação não pode ser desfeita. Todos os dados do paciente "{patient.name}" serão removidos permanentemente, incluindo:
                              <br />• Histórico de sessões
                              <br />• Agendamentos recorrentes
                              <br />• Anotações e prontuários
                              <br />• Todas as informações pessoais
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeletePatient(patient.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Deletar Permanentemente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};