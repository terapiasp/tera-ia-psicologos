import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Session } from '@/hooks/useSessions';
import { Clock, Users } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
        
        <div className="text-xs opacity-90">
          {format(new Date(session.scheduled_at), 'HH:mm')} - {format(addMinutes(new Date(session.scheduled_at), 50), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};