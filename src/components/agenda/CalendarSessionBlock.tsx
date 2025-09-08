import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Session } from '@/hooks/useSessions';

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
        ${getStatusColor(session.status)}
        shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing
        hover:scale-[1.02] border-2 mx-1
        ${session.schedule_id ? 'ring-1 ring-primary/30' : ''}
      `}
    >
      <CardContent className="p-2 h-full flex flex-col justify-center text-center">
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <div className="font-semibold text-sm leading-tight">
            {session.patients?.nickname || session.patients?.name}
            {session.schedule_id && (
              <span className="opacity-75 ml-1">•</span>
            )}
          </div>
          <div className="text-xs opacity-90 mt-1 leading-tight">
            {format(sessionTime, 'HH:mm')}-{format(endTime, 'HH:mm')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};