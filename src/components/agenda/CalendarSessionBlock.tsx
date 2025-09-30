import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Session } from '@/hooks/useSessions';
import { Video } from 'lucide-react';

interface CalendarSessionBlockProps {
  session: Session;
  style?: React.CSSProperties;
  onSessionClick?: (session: Session) => void;
}

export const CalendarSessionBlock: React.FC<CalendarSessionBlockProps> = ({ 
  session, 
  style, 
  onSessionClick 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: session.id,
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const sessionTime = new Date(session.scheduled_at);
  const endTime = addMinutes(sessionTime, session.duration_minutes || 50);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return 'bg-primary text-primary-foreground border-primary/20';
      case 'realizada':
        return 'bg-success text-success-foreground border-success/20';
      case 'cancelada':
        return 'bg-destructive text-destructive-foreground border-destructive/20';
      case 'faltou':
        return 'bg-warning text-warning-foreground border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Resolver o link da sessão (mesma lógica do useSessionLinks)
  const getResolvedSessionLink = () => {
    if (!session.patients) return null;
    
    const patient = session.patients as any;
    const sessionMode = patient.session_mode?.toLowerCase();
    
    if (sessionMode !== 'online' && sessionMode !== 'hybrid') return null;
    
    // Usar link_type para determinar qual campo usar
    if (patient.link_type === 'recurring_meet' && patient.recurring_meet_code) {
      return `https://meet.google.com/${patient.recurring_meet_code}`;
    }
    
    if (patient.link_type === 'external' && patient.external_session_link) {
      return patient.external_session_link;
    }
    
    // Fallback para session_link (campo legado)
    if (patient.session_link) {
      return patient.session_link;
    }
    
    return null;
  };

  const sessionLink = getResolvedSessionLink();

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (sessionLink) {
      console.log('Opening session link:', sessionLink, 'for patient:', session.patients?.name);
      window.open(sessionLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkPointerDown = (e: React.PointerEvent) => {
    // Prevenir que o drag seja iniciado quando clicamos no avatar
    e.stopPropagation();
  };

  if (isDragging) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`
        relative
        ${getStatusColor(session.status)}
        shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:scale-[1.02] border-2 mx-1
        ${session.schedule_id ? 'ring-1 ring-primary/30' : ''}
      `}
    >
      {/* Avatar/Quadradinho com link da sessão */}
      {sessionLink && (
        <div
          onClick={handleLinkClick}
          onPointerDown={handleLinkPointerDown}
          onMouseDown={handleLinkPointerDown as any}
          onTouchStart={handleLinkPointerDown as any}
          className="absolute top-1/2 -translate-y-1/2 right-2 z-50 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary backdrop-blur-sm flex items-center justify-center cursor-pointer hover:shadow-strong hover:scale-125 transition-all duration-200 shadow-md border border-white/30"
          title="Abrir link da sessão"
        >
          <Video className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      
      <CardContent className="p-2 h-full flex flex-col justify-center">
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm leading-tight truncate">
              {session.patients?.nickname || session.patients?.name}
              {session.schedule_id && (
                <span className="opacity-75 ml-1">•</span>
              )}
            </span>
          </div>
          <div className="text-xs opacity-90 mt-1 leading-tight text-left">
            {format(sessionTime, 'HH:mm')}-{format(endTime, 'HH:mm')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};