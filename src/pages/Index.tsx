import { CalendarDays, DollarSign, TrendingUp, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgendaCard } from "@/components/dashboard/AgendaCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { WeeklyView } from "@/components/dashboard/WeeklyView";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Index = () => {
  const todaySessions = [
    {
      id: "1",
      patient: "Ana Silva",
      time: "09:00",
      type: "Terapia Individual",
      status: "confirmed" as const,
      location: "Consultório 1",
    },
    {
      id: "2",
      patient: "João Santos",
      time: "10:30",
      type: "Terapia de Casal",
      status: "pending" as const,
      location: "Consultório 2",
    },
    {
      id: "3",
      patient: "Maria Oliveira",
      time: "14:00",
      type: "Consulta de Retorno",
      status: "confirmed" as const,
      location: "Online",
    },
  ];

  const tomorrowSessions = [
    {
      id: "4",
      patient: "Pedro Costa",
      time: "08:30",
      type: "Primeira Consulta",
      status: "confirmed" as const,
      location: "Consultório 1",
    },
    {
      id: "5",
      patient: "Carla Souza",
      time: "16:00",
      type: "Terapia Individual",
      status: "pending" as const,
      location: "Consultório 2",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-primary p-6 rounded-lg text-white shadow-medium">
              <h1 className="text-2xl font-bold mb-2">Bem-vinda, Dra. Maria Silva</h1>
              <p className="text-white/80">
                Hoje você tem 3 sessões agendadas. Vamos começar o dia!
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Sessões Hoje"
                value="3"
                description="2 confirmadas, 1 pendente"
                icon={CalendarDays}
                trend={{ value: 15, label: "vs ontem" }}
              />
              <StatsCard
                title="Pacientes Ativos"
                value="47"
                description="Este mês"
                icon={Users}
                trend={{ value: 8, label: "vs mês anterior" }}
              />
              <StatsCard
                title="Receita Mensal"
                value="R$ 12.450"
                description="Janeiro 2024"
                icon={DollarSign}
                trend={{ value: 12, label: "vs mês anterior" }}
              />
              <StatsCard
                title="Taxa de Comparecimento"
                value="94%"
                description="Últimos 30 dias"
                icon={TrendingUp}
                trend={{ value: 3, label: "vs período anterior" }}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Agenda */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AgendaCard
                    title="Hoje"
                    date="15 de Janeiro, 2024"
                    sessions={todaySessions}
                  />
                  <AgendaCard
                    title="Amanhã"
                    date="16 de Janeiro, 2024"
                    sessions={tomorrowSessions}
                  />
                </div>
                <WeeklyView />
              </div>

              {/* Right Column - Quick Actions */}
              <div className="space-y-6">
                <QuickActions />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
