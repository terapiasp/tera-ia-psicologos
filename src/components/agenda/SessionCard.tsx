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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:shadow-md
        ${isDragging ? 'opacity-50' : ''}
        ${getStatusColor(session.status)}
      `}
    >
      <CardContent className="p-2">
        <div className="space-y-1">
          <div className="text-sm font-medium truncate">
            {session.patients?.nickname || session.patients?.name}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(session.scheduled_at), 'HH:mm')}
          </div>
          
          {session.modality && (
            <Badge variant="secondary" className="text-xs">
              {session.modality}
            </Badge>
          )}

          {session.value && (
            <div className="text-xs font-medium">
              R$ {session.value.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};