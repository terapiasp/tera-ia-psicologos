import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Session } from '@/hooks/useSessions';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'no_show':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const isRecurring = !!session.schedule_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        cursor-grab active:cursor-grabbing
        transition-all duration-200 text-xs
        rounded px-1.5 py-1 border
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-sm'}
        ${getStatusColor(session.status)}
        ${isRecurring ? 'border-l-2 border-l-accent' : ''}
      `}
    >
      <div className="space-y-0.5">
        <div className="font-medium truncate text-xs leading-tight">
          {session.patients?.nickname || session.patients?.name}
        </div>
        
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 opacity-80">
            <Clock className="h-2.5 w-2.5" />
            <span className="text-xs">
              {format(new Date(session.scheduled_at), 'HH:mm')}
            </span>
          </div>
          
          {session.modality && (
            <span className="text-xs opacity-80 truncate">
              {session.modality}
            </span>
          )}
        </div>

        {session.value && (
          <div className="text-xs font-medium opacity-90">
            R$ {session.value.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};