
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
  
  // Dados para visualização semanal - buscar um período mais amplo para suportar navegação
  const weekStartForData = new Date();
  weekStartForData.setDate(weekStartForData.getDate() - 14); // 2 semanas antes
  const weekEndForData = new Date();
  weekEndForData.setDate(weekEndForData.getDate() + 21); // 3 semanas depois
  const { sessions: weekSessions } = useSessions(weekStartForData, weekEndForData);

  // Transformar sessions para o formato do AgendaCard
  const todaySessions = todaySessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getModalityLabel(session.modality || 'individual'), // Usar modality
    status: mapSessionStatus(session.status),
    location: "Online", // TODO: pegar do paciente ou session
  }));

  const tomorrowSessions = tomorrowSessionsRaw.map(session => ({
    id: session.id,
    patient: session.patients?.name || "Paciente não encontrado",
    time: format(new Date(session.scheduled_at), "HH:mm"),
    type: getModalityLabel(session.modality || 'individual'), // Usar modality
    status: mapSessionStatus(session.status),
    location: "Online",
  }));

  // Estatísticas calculadas
  const activePatients = patients.filter(p => p.status === 'active').length;
  const todaySessionsCount = todaySessions.length;
  const confirmedToday = todaySessions.filter(s => s.status === 'confirmed').length;
  const pendingToday = todaySessions.filter(s => s.status === 'pending').length;
  
  // Cálculo de receita simplificado - soma TODAS as sessões com valor no mês
  const monthlyPredicted = monthSessions
    .filter(s => s.value !== null && s.value !== undefined)
    .reduce((sum, s) => sum + Number(s.value), 0);
  
  const monthlyReceived = monthSessions
    .filter(s => s.paid && s.value !== null && s.value !== undefined)
    .reduce((sum, s) => sum + Number(s.value), 0);
  
  const attendanceRate = monthSessions.length > 0 
    ? Math.round((monthSessions.filter(s => s.status === 'completed').length / monthSessions.length) * 100)
    : 0;

  // Callback para lidar com cliques na data
  const handleDateClick = (date: Date) => {
    console.log("Data selecionada:", format(date, "dd/MM/yyyy"));
    // TODO: Implementar navegação para agenda do dia selecionado
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

  const isLoading = profileLoading;

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
                {getTimeGreeting()}, {profile?.name?.split(' ')[0] || 'Dr(a)'}!
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
                value={`R$ ${monthlyPredicted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                description={`Recebido R$ ${monthlyReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · ${format(currentMonth, "MMMM yyyy", { locale: ptBR })}`}
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
                <WeeklyView 
                  onDateClick={handleDateClick}
                  sessionsData={weekSessions}
                />
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
