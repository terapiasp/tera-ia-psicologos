import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AgendaCard } from '@/components/dashboard/AgendaCard';
import { WeeklyView } from '@/components/dashboard/WeeklyView';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useTodaySessions, useTomorrowSessions } from '@/hooks/useSessions';
import { usePatients } from '@/hooks/usePatients';
import { useProfile } from '@/hooks/useProfile';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionsCacheProvider } from '@/contexts/SessionsCacheContext';

const Index = () => {
  const navigate = useNavigate();
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { sessions: todaySessionsRaw, isLoading: isLoadingToday } = useTodaySessions();
  const { sessions: tomorrowSessionsRaw, isLoading: isLoadingTomorrow } = useTomorrowSessions();
  const { patients, isLoading: isLoadingPatients } = usePatients();
  
  // Dados para estatísticas mensais
  const currentMonth = new Date();
  const { sessions: monthSessions, isLoading: isLoadingMonth } = useSessions(startOfMonth(currentMonth), endOfMonth(currentMonth));

  // Transformar sessions para o formato do AgendaCard
  const todaySessions = todaySessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getModalityLabel(session.modality || 'individual'),
    status: mapSessionStatus(session.status),
    location: "Online",
  }));

  const tomorrowSessions = tomorrowSessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getModalityLabel(session.modality || 'individual'),
    status: mapSessionStatus(session.status),
    location: "Online",
  }));

  // Estatísticas calculadas
  const monthlyStats = {
    predicted: monthSessions
      .filter(s => s.value !== null && s.value !== undefined)
      .reduce((sum, s) => sum + Number(s.value), 0),
    received: monthSessions
      .filter(s => s.paid && s.value !== null && s.value !== undefined)
      .reduce((sum, s) => sum + Number(s.value), 0),
    attendanceRate: monthSessions.length > 0 
      ? Math.round((monthSessions.filter(s => s.status === 'completed').length / monthSessions.length) * 100)
      : 0
  };

  // Função para saudação baseada no horário
  function getTimeGreeting() {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return "Bom dia";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  }

  function getModalityLabel(modality: string) {
    const modalities: Record<string, string> = {
      'individual': 'Individual',
      'couple': 'Casal',
      'family': 'Família',
      'group': 'Grupo',
      'evaluation': 'Avaliação',
      'return': 'Retorno',
      'individual_adult': 'Individual Adulto',
      'individual_child': 'Individual Infantil',
      'individual_teen': 'Individual Adolescente'
    };
    return modalities[modality] || modality;
  }

  function mapSessionStatus(status: string): 'confirmed' | 'pending' | 'completed' {
    if (status === 'scheduled') return 'confirmed';
    if (status === 'confirmed') return 'confirmed';
    if (status === 'completed') return 'completed';
    return 'pending';
  }

  if (isLoadingProfile) {
    return (
      <SessionsCacheProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-6 space-y-6">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </main>
          </div>
        </div>
      </SessionsCacheProvider>
    );
  }

  return (
    <SessionsCacheProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-4 lg:p-6">
            <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {getTimeGreeting()}, {profile?.name?.split(' ')[0] || 'Doutor(a)'}!
              </h1>
              <p className="text-muted-foreground">
                Aqui está um resumo do seu dia e agenda.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoadingToday ? (
                <Skeleton className="h-32" />
              ) : (
                <StatsCard
                  title="Sessões hoje"
                  value={todaySessionsRaw.length}
                  description={`${todaySessionsRaw.filter(s => s.paid).length} pagas`}
                  icon={Calendar}
                />
              )}
              
              {isLoadingPatients ? (
                <Skeleton className="h-32" />
              ) : (
                <StatsCard
                  title="Pacientes ativos"
                  value={patients.filter(p => p.status === 'active').length}
                  description={`${patients.length} total`}
                  icon={Users}
                />
              )}
              
              {isLoadingMonth ? (
                <Skeleton className="h-32" />
              ) : (
                <StatsCard
                  title="Receita do mês"
                  value={`R$ ${monthlyStats.predicted.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}`}
                  description={`R$ ${monthlyStats.received.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })} recebido`}
                  icon={DollarSign}
                />
              )}
              
              {isLoadingMonth ? (
                <Skeleton className="h-32" />
              ) : (
                <StatsCard
                  title="Taxa de comparecimento"
                  value={`${monthlyStats.attendanceRate}%`}
                  description="Este mês"
                  icon={TrendingUp}
                  trend={{
                    value: 5,
                    label: "vs mês anterior"
                  }}
                />
              )}
            </div>

            {/* Today's and Tomorrow's Agenda */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isLoadingToday ? (
                <Skeleton className="h-64" />
              ) : (
                <AgendaCard
                  title="Hoje"
                  date={format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  sessions={todaySessions}
                />
              )}
              
              {isLoadingTomorrow ? (
                <Skeleton className="h-64" />
              ) : (
                <AgendaCard
                  title="Amanhã"
                  date={format(new Date(Date.now() + 24 * 60 * 60 * 1000), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  sessions={tomorrowSessions}
                />
              )}
            </div>

            {/* Weekly Overview + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <WeeklyView 
                  onDateClick={(date) => {
                    navigate('/agenda', { 
                      state: { selectedDate: date } 
                    });
                  }}
                />
              </div>
              <div className="lg:col-span-4">
                <QuickActions />
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </SessionsCacheProvider>
  );
};

export default Index;