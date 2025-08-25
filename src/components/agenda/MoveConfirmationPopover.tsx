import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, DollarSign, Repeat, Trash2, MapPin } from 'lucide-react';

interface MoveConfirmationPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  patient?: Patient | null;
  onConfirm: (moveType: 'single' | 'series') => void;
  onDelete?: () => void;
}

export const MoveConfirmationPopover: React.FC<MoveConfirmationPopoverProps> = ({
  open,
  onOpenChange,
  session,
  patient: patientData,
  onConfirm,
  onDelete,
}) => {
  if (!session) return null;

  const isRecurring = !!session.schedule_id;
  const sessionDate = new Date(session.scheduled_at);
  const sessionPatient = session.patients;

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getModalityDisplay = (modality: string | null | undefined) => {
    const modalityMap: Record<string, string> = {
      'online': 'Online',
      'presencial': 'Presencial',
      'hibrido': 'Híbrido'
    };
    return modalityMap[modality || ''] || 'Não informado';
  };

  const getFrequencyDisplay = (frequency: string | null | undefined) => {
    const frequencyMap: Record<string, string> = {
      'semanal': 'Semanal',
      'quinzenal': 'Quinzenal',
      'mensal': 'Mensal'
    };
    return frequencyMap[frequency || ''] || 'Não informado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {sessionPatient?.nickname || sessionPatient?.name || 'Sessão'}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(sessionDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Informações do paciente */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Modalidade</p>
                  <p className="text-sm font-medium">{getModalityDisplay(session.modality || patientData?.session_mode)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Frequência</p>
                  <p className="text-sm font-medium">{getFrequencyDisplay(patientData?.frequency)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor da Sessão</p>
                  <p className="text-sm font-medium">{formatCurrency(session.value)}</p>
                </div>
              </div>

              {isRecurring && (
                <div>
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    Sessão Recorrente
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O que você gostaria de fazer?
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => onConfirm('single')}
                className="w-full justify-start h-auto py-3"
              >
                <MapPin className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Mover apenas esta sessão</div>
                  <div className="text-xs text-muted-foreground">Alterar horário desta ocorrência específica</div>
                </div>
              </Button>
              
              {isRecurring && (
                <Button
                  variant="outline"
                  onClick={() => onConfirm('series')}
                  className="w-full justify-start h-auto py-3"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Mover todas as sessões futuras</div>
                    <div className="text-xs text-muted-foreground">Alterar horário de toda a série a partir desta data</div>
                  </div>
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="w-full justify-start h-auto py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Excluir esta sessão</div>
                    <div className="text-xs text-muted-foreground">Remover permanentemente esta sessão</div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};