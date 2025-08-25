import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Session } from '@/hooks/useSessions';

interface SessionCardProps {
  session: Session;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        ${getStatusColor(session.status)}
        shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:scale-[1.02] border-2
        ${session.schedule_id ? 'ring-1 ring-primary/30' : ''}
      `}
    >
      <CardContent className="p-3">
        <div className="text-sm font-semibold leading-tight mb-1">
          {session.patients?.nickname || session.patients?.name}
        </div>
        <div className="text-xs font-medium opacity-90">
          {format(sessionTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
        </div>
        {session.schedule_id && (
          <div className="text-xs opacity-75 mt-1">
            Recorrente
          </div>
        )}
      </CardContent>
    </Card>
  );
};