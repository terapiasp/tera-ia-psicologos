import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, startOfDay, differenceInMinutes, addMinutes } from 'date-fns';
import { CalendarSessionBlock } from './CalendarSessionBlock';
import { Session } from '@/hooks/useSessions';

interface DayColumnProps {
  date: Date;
  sessions: Session[];
  startHour: number;
  endHour: number;
  onSessionClick?: (session: Session) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({ 
  date, 
  sessions, 
  startHour, 
  endHour, 
  onSessionClick 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: { date, type: 'day' }
  });

  // Calcular altura total em minutos
  const totalMinutes = (endHour - startHour) * 60;
  const minuteHeight = 60 / 60; // 60px por hora, então 1px por minuto

  // Filtrar e processar sessões do dia
  const daySessions = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    return format(sessionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  // Calcular posicionamento e agrupamento para overlaps
  const processedSessions = daySessions.map(session => {
    const sessionStart = new Date(session.scheduled_at);
    const dayStart = new Date(date);
    dayStart.setHours(startHour, 0, 0, 0);
    
    const startMinutesFromTop = differenceInMinutes(sessionStart, dayStart);
    const duration = session.duration_minutes || 50;
    
    return {
      ...session,
      startMinutesFromTop,
      duration,
      top: Math.max(0, startMinutesFromTop * minuteHeight),
      height: duration * minuteHeight
    };
  });

  // Detectar overlaps e calcular larguras/posições
  const sessionsWithLayout = processedSessions.map((session, index) => {
    const overlapping = processedSessions.filter((other, otherIndex) => {
      if (index === otherIndex) return false;
      
      const sessionEnd = session.startMinutesFromTop + session.duration;
      const otherEnd = other.startMinutesFromTop + other.duration;
      
      return !(sessionEnd <= other.startMinutesFromTop || session.startMinutesFromTop >= otherEnd);
    });

    const totalOverlapping = overlapping.length + 1;
    const width = 100 / totalOverlapping;
    const leftOffset = overlapping.filter(other => 
      other.startMinutesFromTop < session.startMinutesFromTop || 
      (other.startMinutesFromTop === session.startMinutesFromTop && other.id < session.id)
    ).length * width;

    return {
      ...session,
      width: `${width}%`,
      left: `${leftOffset}%`
    };
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        relative border-l-2 border-border/60 transition-all duration-200
        ${isOver ? 'bg-primary/5' : 'hover:bg-muted/20'}
      `}
      style={{ height: `${totalMinutes * minuteHeight}px` }}
    >
      {/* Linhas de hora */}
      {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t-2 border-border/50"
          style={{ top: `${i * 60}px` }}
        />
      ))}

      {/* Sessões */}
      {sessionsWithLayout.map((session) => (
        <CalendarSessionBlock
          key={session.id}
          session={session}
          style={{
            position: 'absolute',
            top: `${session.top}px`,
            height: `${session.height}px`,
            left: session.left,
            width: session.width,
            zIndex: 10
          }}
          onSessionClick={onSessionClick}
        />
      ))}
    </div>
  );
};