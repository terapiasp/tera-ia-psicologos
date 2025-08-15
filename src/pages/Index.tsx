import { CalendarDays, DollarSign, TrendingUp, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgendaCard } from "@/components/dashboard/AgendaCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { WeeklyView } from "@/components/dashboard/WeeklyView";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useTodaySessions, useTomorrowSessions, useSessions } from "@/hooks/useSessions";
import { usePatients } from "@/hooks/usePatients";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const { profile, isLoading: profileLoading } = useProfile();
  const { sessions: todaySessionsRaw, isLoading: todayLoading } = useTodaySessions();
  const { sessions: tomorrowSessionsRaw, isLoading: tomorrowLoading } = useTomorrowSessions();
  const { patients } = usePatients();
  
  // Dados para estatísticas mensais
  const currentMonth = new Date();
  const { sessions: monthSessions } = useSessions(startOfMonth(currentMonth), endOfMonth(currentMonth));
  
  // Dados para visualização semanal
  const currentWeek = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  });
  const { sessions: weekSessions } = useSessions(currentWeek[0], currentWeek[6]);

  // Transformar sessions para o formato do AgendaCard
  const todaySessions = todaySessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getSessionTypeLabel(session.type),
    status: mapSessionStatus(session.status),
    location: "Online", // TODO: pegar do paciente ou session
  }));

  const tomorrowSessions = tomorrowSessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getSessionTypeLabel(session.type),
    status: mapSessionStatus(session.status),
    location: "Online",
  }));

  // Estatísticas calculadas
  const activePatients = patients.filter(p => p.status === 'active').length;
  const todaySessionsCount = todaySessions.length;
  const confirmedToday = todaySessions.filter(s => s.status === 'confirmed').length;
  const pendingToday = todaySessions.filter(s => s.status === 'pending').length;
  
  const monthlyRevenue = monthSessions
    .filter(s => s.paid && s.value)
    .reduce((sum, s) => sum + (s.value || 0), 0);
  
  const attendanceRate = monthSessions.length > 0 
    ? Math.round((monthSessions.filter(s => s.status === 'completed').length / monthSessions.length) * 100)
    : 0;

  // Dados para WeeklyView
  const weekData = currentWeek.map(day => ({
    date: format(day, "dd/MM"),
    day: format(day, "EEEEEE", { locale: ptBR }),
    sessions: weekSessions.filter(session => 
      isSameDay(new Date(session.scheduled_at), day)
    ).length,
    isToday: isSameDay(day, new Date())
  }));

  function getSessionTypeLabel(type: string) {
    const types: Record<string, string> = {
      'individual': 'Individual',
      'couple': 'Casal',
      'family': 'Família',
      'group': 'Grupo',
      'evaluation': 'Avaliação',
      'return': 'Retorno'
    };
    return types[type] || type;
  }

  function mapSessionStatus(status: string): 'confirmed' | 'pending' | 'completed' {
    if (status === 'scheduled') return 'confirmed';
    if (status === 'confirmed') return 'confirmed';
    if (status === 'completed') return 'completed';
    return 'pending';
  }

  const isLoading = profileLoading || todayLoading || tomorrowLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 transition-all duration-300">
            <div className="p-6 space-y-6">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300">
          <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-primary p-6 rounded-lg text-white shadow-medium">
              <h1 className="text-2xl font-bold mb-2">
                Bem-vind{profile?.name?.includes('a') ? 'a' : 'o'}, {profile?.name?.split(' ')[0] || 'Dr(a)'}
              </h1>
              <p className="text-white/80">
                Hoje você tem {todaySessionsCount} sessão{todaySessionsCount !== 1 ? 's' : ''} agendada{todaySessionsCount !== 1 ? 's' : ''}
                {todaySessionsCount > 0 && `. ${confirmedToday} confirmada${confirmedToday !== 1 ? 's' : ''}, ${pendingToday} pendente${pendingToday !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Sessões Hoje"
                value={todaySessionsCount.toString()}
                description={todaySessionsCount > 0 ? `${confirmedToday} confirmada${confirmedToday !== 1 ? 's' : ''}, ${pendingToday} pendente${pendingToday !== 1 ? 's' : ''}` : "Nenhuma sessão hoje"}
                icon={CalendarDays}
              />
              <StatsCard
                title="Pacientes Ativos"
                value={activePatients.toString()}
                description="Total cadastrados"
                icon={Users}
              />
              <StatsCard
                title="Receita Mensal"
                value={`R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                description={format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                icon={DollarSign}
              />
              <StatsCard
                title="Taxa de Comparecimento"
                value={`${attendanceRate}%`}
                description="Últimos 30 dias"
                icon={TrendingUp}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Agenda */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AgendaCard
                    title="Hoje"
                    date={format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    sessions={todaySessions}
                  />
                  <AgendaCard
                    title="Amanhã"
                    date={format(new Date(Date.now() + 24 * 60 * 60 * 1000), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    sessions={tomorrowSessions}
                  />
                </div>
                <WeeklyView weekData={weekData} />
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
