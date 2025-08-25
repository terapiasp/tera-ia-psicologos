import React, { useState } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SchedulerBoard } from "@/components/agenda/SchedulerBoard";
import { startOfWeek } from 'date-fns';

const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300">
          <div className="p-2">
            <SchedulerBoard 
              weekStart={currentWeek} 
              onWeekChange={setCurrentWeek}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Agenda;