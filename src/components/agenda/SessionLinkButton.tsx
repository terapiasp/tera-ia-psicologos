import React from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSessionLinks, SessionLinkStatus } from '@/hooks/useSessionLinks';
import { Patient } from '@/hooks/usePatients';

interface SessionLinkButtonProps {
  patient: Patient | { 
    name: string; 
    nickname?: string; 
    session_link?: string; 
    session_mode?: string;
    id?: string;
    link_type?: 'recurring_meet' | 'external' | null;
    recurring_meet_code?: string;
    external_session_link?: string;
    link_created_at?: string;
    link_last_used?: string;
  };
  size?: 'sm' | 'default';
  variant?: 'icon' | 'full';
  onClick?: (e: React.MouseEvent) => void;
}

export const SessionLinkButton: React.FC<SessionLinkButtonProps> = ({
  patient,
  size = 'sm',
  variant = 'icon',
  onClick
}) => {
  const { getResolvedLink, getLinkStatus, updateLinkLastUsed } = useSessionLinks();
  
  // Verificar se o paciente tem as propriedades necessárias para link de sessão
  const hasLinkData = 'link_type' in patient && 'id' in patient;
  
  // Priorizar novos campos de link, mas manter fallback para session_link antigo
  let resolvedLink: string | null = null;
  let linkStatus: SessionLinkStatus = { status: 'none' };
  
  if (hasLinkData) {
    resolvedLink = getResolvedLink(patient as Patient);
    linkStatus = getLinkStatus(patient as Patient);
    console.log('SessionLinkButton - Patient:', patient.name, 'Link Type:', patient.link_type, 'Resolved Link:', resolvedLink);
    
    // Se não há link nos novos campos, tentar fallback
    if (!resolvedLink && patient.session_link) {
      resolvedLink = patient.session_link;
      linkStatus = { status: 'active', resolvedLink: patient.session_link };
      console.log('SessionLinkButton - Using fallback session_link:', resolvedLink);
    }
  } else if (patient.session_link) {
    resolvedLink = patient.session_link;
    linkStatus = { status: 'active', resolvedLink: patient.session_link };
    console.log('SessionLinkButton - Only session_link available:', resolvedLink);
  }

  // Só mostrar para sessões online ou híbridas e quando há link configurado
  if (
    (!patient.session_mode || (patient.session_mode !== 'online' && patient.session_mode !== 'hybrid')) ||
    !resolvedLink ||
    linkStatus.status === 'none'
  ) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onClick) {
      onClick(e);
    }

    // Atualizar último uso se for Google Meet e tem ID
    if (hasLinkData && patient.link_type === 'recurring_meet' && patient.id) {
      await updateLinkLastUsed(patient.id);
    }

    // Abrir link
    window.open(resolvedLink, '_blank', 'noopener,noreferrer');
  };

  const getStatusColor = () => {
    switch (linkStatus.status) {
      case 'active':
        return 'text-green-600 hover:text-green-700';
      case 'expiring':
        return 'text-yellow-600 hover:text-yellow-700';
      case 'expired':
        return 'text-red-600 hover:text-red-700';
      default:
        return 'text-primary hover:text-primary/80';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    if (hasLinkData && patient.link_type === 'recurring_meet') {
      return <Video className={iconSize} />;
    }
    return <ExternalLink className={iconSize} />;
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`p-1 h-auto ${getStatusColor()} transition-colors`}
        title={`Abrir link de sessão (${linkStatus.status === 'active' ? 'ativo' : 
               linkStatus.status === 'expiring' ? 'expirando' : 'expirado'})`}
      >
        {getIcon()}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={`${getStatusColor()} transition-colors gap-2`}
    >
      {getIcon()}
      <span className="text-xs">
        {hasLinkData && patient.link_type === 'recurring_meet' ? 'Google Meet' : 'Link Sessão'}
      </span>
      {hasLinkData && linkStatus.status !== 'active' && (
        <Badge 
          variant="secondary" 
          className={`text-xs ${
            linkStatus.status === 'expiring' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
            'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {linkStatus.status === 'expiring' ? 'Expirando' : 'Expirado'}
        </Badge>
      )}
    </Button>
  );
};