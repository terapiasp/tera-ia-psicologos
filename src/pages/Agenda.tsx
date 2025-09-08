import React, { useState, useEffect } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SchedulerBoard } from "@/components/agenda/SchedulerBoard";
import { TimelineView } from "@/components/agenda/TimelineView";
import { WeekNavigator } from "@/components/agenda/WeekNavigator";
import { ViewModeToggle } from "@/components/agenda/ViewModeToggle";
import { WeekendToggle } from "@/components/agenda/WeekendToggle";
import { startOfWeek } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const Agenda = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Verificar se há uma data selecionada no state do router
    const selectedDate = location.state?.selectedDate;
    if (selectedDate) {
      return startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  
  // Estado do modo de visualização com preferência salva
  const [viewMode, setViewMode] = useState<'week' | 'timeline'>(() => {
    const saved = localStorage.getItem('agenda-view-mode');
    if (saved && (saved === 'week' || saved === 'timeline')) {
      return saved;
    }
    return isMobile ? 'timeline' : 'week';
  });

  // Estado para mostrar/esconder fins de semana
  const [showWeekends, setShowWeekends] = useState(() => {
    const saved = localStorage.getItem('agenda-show-weekends');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem('agenda-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('agenda-show-weekends', JSON.stringify(showWeekends));
  }, [showWeekends]);

  // Atualizar semana quando uma data específica for selecionada via navegação
  useEffect(() => {
    const selectedDate = location.state?.selectedDate;
    if (selectedDate) {
      const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
      setCurrentWeek(weekStart);
    }
  }, [location.state?.selectedDate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300">
          <div className="p-4 space-y-4">
            {/* Cabeçalho com navegação e toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {viewMode === 'week' && (
                <WeekNavigator 
                  currentWeek={currentWeek}
                  onWeekChange={setCurrentWeek}
                />
              )}
              {viewMode === 'timeline' && <div />}
              <div className="flex items-center gap-4">
                {viewMode === 'week' && (
                  <WeekendToggle 
                    showWeekends={showWeekends}
                    onToggle={setShowWeekends}
                  />
                )}
                <ViewModeToggle 
                  value={viewMode}
                  onValueChange={setViewMode}
                />
              </div>
            </div>

            {/* Conteúdo da agenda baseado no modo */}
            {viewMode === 'week' ? (
              <SchedulerBoard 
                weekStart={currentWeek} 
                onWeekChange={setCurrentWeek}
                showWeekends={showWeekends}
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