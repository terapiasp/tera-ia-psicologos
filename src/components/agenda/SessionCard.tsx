import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Session } from '@/hooks/useSessions';

interface SessionCardProps {
  session: Session;
  onSessionClick?: (session: Session) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onSessionClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: session.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const sessionTime = new Date(session.scheduled_at);
  const endTime = addMinutes(sessionTime, 50);

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
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`
        ${getStatusColor(session.status)}
        shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:scale-[1.02] border-2
        ${session.schedule_id ? 'ring-1 ring-primary/30' : ''}
      `}
    >
      <CardContent className="p-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate flex-1 text-sm text-foreground">
            {session.patients?.nickname || session.patients?.name}
            {session.schedule_id && (
              <span className="opacity-75 ml-1">•</span>
            )}
          </span>
          <span className="font-medium opacity-90 whitespace-nowrap text-xs">
            {format(sessionTime, 'HH:mm')}-{format(endTime, 'HH:mm')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};