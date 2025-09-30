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
    
    // Priorizar recurring_meet_code
    if (patient.recurring_meet_code) {
      return `https://meet.google.com/${patient.recurring_meet_code}`;
    }
    
    // Fallback para external_link
    if (patient.external_link) {
      return patient.external_link;
    }
    
    return null;
  };

  const sessionLink = getResolvedSessionLink();

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (sessionLink) {
      window.open(sessionLink, '_blank', 'noopener,noreferrer');
    }
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
          className="absolute top-1 right-1 z-50 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/60 hover:scale-110 transition-all duration-200 pointer-events-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <Video className="h-3 w-3 text-white" />
        </div>
      )}
      
      <CardContent className="p-2 h-full flex flex-col justify-center pointer-events-none">
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