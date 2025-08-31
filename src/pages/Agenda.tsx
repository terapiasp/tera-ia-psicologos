import React, { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SchedulerBoard } from "@/components/agenda/SchedulerBoard";
import { TimelineView } from "@/components/agenda/TimelineView";
import { WeekNavigator } from "@/components/agenda/WeekNavigator";
import { ViewModeToggle } from "@/components/agenda/ViewModeToggle";
import { startOfWeek } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
          <div className="p-4 space-y-4">
            {/* Cabeçalho com navegação e toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <WeekNavigator 
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
              />
              <ViewModeToggle 
                value={viewMode}
                onValueChange={setViewMode}
              />
            </div>

            {/* Conteúdo da agenda baseado no modo */}
            {viewMode === 'week' ? (
              <SchedulerBoard 
                weekStart={currentWeek} 
                onWeekChange={setCurrentWeek}
              />
            ) : (
              <TimelineView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Agenda;