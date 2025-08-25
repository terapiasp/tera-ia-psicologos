import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SessionCard } from './SessionCard';
import { Session } from '@/hooks/useSessions';

interface TimeSlotProps {
  date: Date;
  time: Date;
  sessions: Session[];
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ date, time, sessions }) => {
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
        min-h-[50px] border border-border/40 rounded-md p-1
        transition-colors duration-200
        ${isOver ? 'bg-primary/10 border-primary/40' : 'bg-background'}
        ${sessions.length === 0 ? 'hover:bg-muted/50' : ''}
      `}
    >
      <div className="space-y-1">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};