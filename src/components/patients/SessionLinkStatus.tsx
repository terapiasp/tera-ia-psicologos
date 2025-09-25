import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Link, Clock, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { useSessionLinks } from "@/hooks/useSessionLinks";
import { Patient } from "@/hooks/usePatients";

interface SessionLinkStatusProps {
  patient: Patient;
  compact?: boolean;
}

const SessionLinkStatus: React.FC<SessionLinkStatusProps> = ({ 
  patient, 
  compact = false 
}) => {
  const { 
    getLinkStatus, 
    updateLinkLastUsed, 
    renewMeetCode,
    isUpdatingLastUsed,
    isRenewingCode 
  } = useSessionLinks();
  
  const linkStatus = getLinkStatus(patient);

  if (linkStatus.status === 'none') {
    return compact ? null : (
      <div className="text-xs text-muted-foreground">
        Sem link configurado
      </div>
    );
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkStatus.resolvedLink) {
      // Atualizar último uso se for Google Meet
      if (patient.link_type === 'recurring_meet') {
        updateLinkLastUsed(patient.id);
      }
      window.open(linkStatus.resolvedLink, '_blank');
    }
  };

  const handleRenewCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Gerar novo código do Google Meet (simulação - normalmente viria de uma API)
    const newCode = Math.random().toString(36).substring(2, 5) + '-' +
                   Math.random().toString(36).substring(2, 5) + '-' +
                   Math.random().toString(36).substring(2, 5);
    renewMeetCode({ patientId: patient.id, newCode });
  };

  const getStatusBadge = () => {
    switch (linkStatus.status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            {patient.link_type === 'recurring_meet' ? (
              <Video className="h-3 w-3 mr-1" />
            ) : (
              <Link className="h-3 w-3 mr-1" />
            )}
            Ativo
          </Badge>
        );
      case 'expiring':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Expira em {30 - (linkStatus.daysSinceLastUse || 0)} dias
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {linkStatus.resolvedLink && linkStatus.status !== 'expired' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLinkClick}
            className="h-6 w-6 p-0"
            title="Abrir link da sessão"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {patient.link_type === 'recurring_meet' && linkStatus.daysSinceLastUse !== undefined && (
            <span className="text-xs text-muted-foreground">
              Usado há {linkStatus.daysSinceLastUse} dias
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {linkStatus.resolvedLink && linkStatus.status !== 'expired' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLinkClick}
              disabled={isUpdatingLastUsed}
              className="h-8 px-2"
              title="Abrir link da sessão"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir
            </Button>
          )}
          
          {patient.link_type === 'recurring_meet' && linkStatus.status === 'expired' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenewCode}
              disabled={isRenewingCode}
              className="h-8 px-2"
              title="Renovar código do Google Meet"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRenewingCode ? 'animate-spin' : ''}`} />
              Renovar
            </Button>
          )}
        </div>
      </div>
      
      {linkStatus.resolvedLink && (
        <div className="text-xs text-muted-foreground break-all">
          {linkStatus.resolvedLink}
        </div>
      )}
    </div>
  );
};

export default SessionLinkStatus;