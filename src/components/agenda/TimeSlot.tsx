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
        h-12 sm:h-[38px] p-1 rounded-md transition-all duration-200 touch-manipulation min-w-[112px]
        ${isOver 
          ? 'bg-primary/10 border border-primary/30' 
          : 'bg-card hover:bg-muted/40 border border-border/20'
        }
        flex flex-col justify-start items-stretch gap-1 overflow-hidden
      `}
    >
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onSessionClick={onSessionClick} />
      ))}
    </div>
  );
};