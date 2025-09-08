import React from 'react';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { Clock, User, DollarSign, Repeat } from 'lucide-react';

interface SessionEventCardProps {
  session: Session;
  patient?: Patient;
  onSessionClick?: (session: Session) => void;
}

export const SessionEventCard: React.FC<SessionEventCardProps> = ({ 
  session, 
  patient, 
  onSessionClick 
}) => {
  const sessionTime = new Date(session.scheduled_at);
  const duration = session.duration_minutes || 50;
  const endTime = addMinutes(sessionTime, duration);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
      case 'scheduled':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'realizada':
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelada':
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'faltou':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'confirmada':
        return 'Confirmada';
      case 'realizada':
        return 'Realizada';
      case 'cancelada':
        return 'Cancelada';
      case 'faltou':
        return 'Faltou';
      default:
        return status;
    }
  };

  const getTherapyTypeDisplay = (therapyType: string | null | undefined) => {
    const therapyTypeMap: Record<string, string> = {
      'individual_adult': 'Adulto Individual',
      'individual_teen': 'Adolescente Individual',
      'individual_child': 'Infantil Individual',
      'couple_therapy': 'Terapia de Casal',
      'family_therapy': 'Terapia Familiar',
      'group_therapy': 'Terapia em Grupo',
    };
    return therapyTypeMap[therapyType || ''] || therapyType || 'Não informado';
  };

  const getModalityDisplay = (modality: string | null | undefined) => {
    const modalityMap: Record<string, string> = {
      'online': 'Online',
      'presencial': 'Presencial',
      'hibrido': 'Híbrido'
    };
    return modalityMap[modality || ''] || modality || 'Não informado';
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleClick = () => {
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  return (
    <Card 
      className="hover:shadow-medium transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2"
      onClick={handleClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header com nome e horário */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {patient?.nickname || patient?.name || 'Paciente'}
            </span>
            {session.schedule_id && (
              <Repeat className="h-3 w-3 text-primary opacity-75" />
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-medium">
              {format(sessionTime, 'HH:mm')}-{format(endTime, 'HH:mm')}
            </span>
          </div>
        </div>

        {/* Informações da sessão */}
        <div className="text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo de Terapia</p>
            <p className="font-medium">{getTherapyTypeDisplay(patient?.therapy_type)}</p>
          </div>
        </div>

        {/* Valor e status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{formatCurrency(session.value)}</span>
          </div>
          <Badge 
            variant="secondary" 
            className={`text-xs ${getStatusColor(session.status)}`}
          >
            {getStatusText(session.status)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};