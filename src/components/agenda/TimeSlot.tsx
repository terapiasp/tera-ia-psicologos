import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SessionCard } from './SessionCard';
import { Session } from '@/hooks/useSessions';

interface TimeSlotProps {
  date: Date;
  time: Date;
  sessions: Session[];
  onSessionClick?: (session: Session) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ date, time, sessions, onSessionClick }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `${date.toISOString()}-${time.toISOString()}`,
    data: {
      date,
      time,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        h-[60px] p-1 rounded-md transition-all duration-200
        ${isOver 
          ? 'bg-primary/10 border-2 border-primary/30 shadow-soft' 
          : 'bg-card hover:bg-muted/40 border border-border/30'
        }
        flex flex-col justify-start gap-1 overflow-hidden
      `}
    >
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onSessionClick={onSessionClick} />
      ))}
    </div>
  );
};