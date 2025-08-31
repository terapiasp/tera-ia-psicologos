import React, { useState, useEffect, useMemo } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SchedulerBoard } from "@/components/agenda/SchedulerBoard";
import { TimelineView } from "@/components/agenda/TimelineView";
import { AgendaToolbar } from "@/components/agenda/AgendaToolbar";
import { startOfWeek } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePatients } from '@/hooks/usePatients';
import { useInfiniteSessions } from '@/hooks/useInfiniteSessions';

const Agenda = () => {
  const isMobile = useIsMobile();
  const [currentWeek, setCurrentWeek] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // Estado do modo de visualização com preferência salva
  const [viewMode, setViewMode] = useState<'week' | 'timeline'>(() => {
    const saved = localStorage.getItem('agenda-view-mode');
    if (saved && (saved === 'week' || saved === 'timeline')) {
      return saved;
    }
    return isMobile ? 'timeline' : 'week';
  });

  // Estados dos filtros (apenas para timeline)
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all');

  const { patients } = usePatients();
  const { sessions } = useInfiniteSessions();

  // Calcular estatísticas das sessões
  const sessionsCount = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter(s => s.status === 'scheduled').length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    
    return { total, scheduled, completed, cancelled };
  }, [sessions]);

  // Salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('agenda-view-mode', viewMode);
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300">
          {/* Barra de ferramentas unificada */}
          <AgendaToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentWeek={viewMode === 'week' ? currentWeek : undefined}
            onWeekChange={viewMode === 'week' ? setCurrentWeek : undefined}
            statusFilter={viewMode === 'timeline' ? statusFilter : undefined}
            onStatusFilterChange={viewMode === 'timeline' ? setStatusFilter : undefined}
            patientFilter={viewMode === 'timeline' ? patientFilter : undefined}
            onPatientFilterChange={viewMode === 'timeline' ? setPatientFilter : undefined}
            patients={patients}
            sessionsCount={sessionsCount}
          />

          {/* Conteúdo da agenda baseado no modo */}
          {viewMode === 'week' ? (
            <SchedulerBoard 
              weekStart={currentWeek} 
              onWeekChange={setCurrentWeek}
            />
          ) : (
            <TimelineView 
              statusFilter={statusFilter}
              patientFilter={patientFilter}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Agenda;