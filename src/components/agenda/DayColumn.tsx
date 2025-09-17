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
    // Deixar mais espaço entre sessões sobrepostas e uma margem de segurança
    const width = Math.max(30, (100 - 8) / totalOverlapping); // 8% de margem total
    const leftOffset = overlapping.filter(other => 
      other.startMinutesFromTop < session.startMinutesFromTop || 
      (other.startMinutesFromTop === session.startMinutesFromTop && other.id < session.id)
    ).length * (width + 2); // 2% de espaçamento entre sessões

    return {
      ...session,
      width: `${Math.min(width, 96)}%`, // Máximo de 96% para evitar overflow
      left: `${Math.min(leftOffset, 100 - width)}%`
    };
  });

  return (
    <div 
      className="relative border-l-2 border-border/70"
      style={{ height: `${totalMinutes * minuteHeight}px` }}
    >
      {/* Slots de hora com feedback visual individual */}
      {Array.from({ length: endHour - startHour }, (_, i) => {
        const hourDate = new Date(date);
        hourDate.setHours(startHour + i, 0, 0, 0);
        
        return (
          <HourSlot
            key={i}
            date={date}
            hour={startHour + i}
            hourDate={hourDate}
            top={i * 60}
          />
        );
      })}

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

// Componente para cada slot de hora
interface HourSlotProps {
  date: Date;
  hour: number;
  hourDate: Date;
  top: number;
}

const HourSlot: React.FC<HourSlotProps> = ({ date, hour, hourDate, top }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date.toISOString()}-${hour}`,
    data: { date, time: hourDate, type: 'hour' }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute left-0 right-0 h-[60px] transition-all duration-200
        border-t-2 border-border/60
        ${isOver ? 'bg-primary/15 border-primary/40' : 'hover:bg-muted/30 hover:border-border/80'}
      `}
      style={{ top: `${top}px` }}
    />
  );
};