import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  AlertCircle,
  Receipt
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSessions } from "@/hooks/useSessions";
import { usePatients } from "@/hooks/usePatients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PixKeyForm } from "@/components/pagamentos/PixKeyForm";
import { PixQrCodeGenerator } from "@/components/pagamentos/PixQrCodeGenerator";
import { TransfersTable } from "@/components/pagamentos/TransfersTable";

type FilterType = 'all' | 'pending' | 'paid';

export default function Pagamentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentMonth = new Date();
  const { sessions, isLoading } = useSessions(startOfMonth(currentMonth), endOfMonth(currentMonth));
  const { patients } = usePatients();
  const [filter, setFilter] = useState<FilterType>('all');

  // Mutation para marcar sessões como pagas
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ sessionIds, paid }: { sessionIds: string[], paid: boolean }) => {
      const { error } = await supabase
        .from('sessions')
        .update({ paid })
        .in('id', sessionIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Atualizado",
        description: "Status de pagamento atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de pagamento",
        variant: "destructive",
      });
    }
  });

  // Filtrar sessões
  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    if (filter === 'pending') return sessions.filter(s => !s.paid);
    return sessions.filter(s => s.paid);
  }, [sessions, filter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const predicted = sessions
      .filter(s => s.value !== null)
      .reduce((sum, s) => sum + Number(s.value), 0);
    
    const received = sessions
      .filter(s => s.paid && s.value !== null)
      .reduce((sum, s) => sum + Number(s.value), 0);
    
    const pending = predicted - received;
    
    return { predicted, received, pending };
  }, [sessions]);

  // Agrupar por esquema de pagamento
  const groupedByScheme = useMemo(() => {
    const groups: {
      fixed_day: { patient: any; sessions: any[] }[];
      per_period: { patient: any; sessions: any[] }[];
      per_session: any[];
    } = {
      fixed_day: [],
      per_period: [],
      per_session: []
    };

    filteredSessions.forEach(session => {
      const patient = patients.find(p => p.id === session.patient_id);
      if (!patient) return;

      const scheme = patient.payment_scheme || 'fixed_day';

      if (scheme === 'per_session') {
        groups.per_session.push({ ...session, patient });
      } else {
        const existingGroup = groups[scheme].find(g => g.patient.id === patient.id);
        if (existingGroup) {
          existingGroup.sessions.push(session);
        } else {
          groups[scheme].push({ patient, sessions: [session] });
        }
      }
    });

    return groups;
  }, [filteredSessions, patients]);

  const handleTogglePaid = (sessionId: string, currentPaid: boolean) => {
    markAsPaidMutation.mutate({ sessionIds: [sessionId], paid: !currentPaid });
  };

  const handleToggleAllPatientSessions = (sessionIds: string[], allPaid: boolean) => {
    markAsPaidMutation.mutate({ sessionIds, paid: !allPaid });
  };

  const getStatusBadge = (paid: boolean) => {
    return paid ? (
      <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Pago
      </Badge>
    ) : (
      <Badge variant="outline" className="border-amber-200 text-amber-700">
        <Circle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <div className="md:pl-64 pt-16">
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pagamentos</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie cobranças, transferências e configure suas preferências de recebimento
            </p>
          </div>

          <Tabs defaultValue="cobrancas" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent md:bg-muted p-0 md:p-1">
              <TabsTrigger value="dashboard" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="cobrancas" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                <Receipt className="h-4 w-4" />
                <span>Cobranças</span>
              </TabsTrigger>
              <TabsTrigger value="transferencias" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline">Transferências</span>
                <span className="md:hidden">Transfer.</span>
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden md:inline">Configurações PIX</span>
                <span className="md:hidden">PIX</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
              <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Previsto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {stats.predicted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Recebido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.received / stats.predicted) * 100 || 0).toFixed(1)}% do previsto
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pendente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sessions.filter(s => !s.paid).length} cobranças pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cobranças Tab */}
            <TabsContent value="cobrancas" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl">Cobranças de {format(currentMonth, "MMMM", { locale: ptBR })}</CardTitle>
                      <CardDescription className="text-sm">
                        Gerencie os pagamentos das sessões realizadas
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        className="flex-1 md:flex-none"
                      >
                        Todos
                      </Button>
                      <Button
                        size="sm"
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilter('pending')}
                        className="flex-1 md:flex-none"
                      >
                        Pendentes
                      </Button>
                      <Button
                        size="sm"
                        variant={filter === 'paid' ? 'default' : 'outline'}
                        onClick={() => setFilter('paid')}
                        className="flex-1 md:flex-none"
                      >
                        Pagos
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </div>
                  ) : (
                    <Accordion type="multiple" defaultValue={['fixed_day', 'per_period', 'per_session']} className="space-y-4">
                      {/* Dia Fixo */}
                      <AccordionItem value="fixed_day" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">Dia Fixo do Mês</span>
                            <Badge variant="secondary">{groupedByScheme.fixed_day.length} pacientes</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-3">
                          {groupedByScheme.fixed_day.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum paciente com pagamento por dia fixo
                            </p>
                          ) : (
                            groupedByScheme.fixed_day.map(({ patient, sessions: patientSessions }) => {
                              const allPaid = patientSessions.every(s => s.paid);
                              const totalValue = patientSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
                              
                              return (
                                <div key={patient.id} className="border rounded-lg p-3 md:p-4 space-y-2">
                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2">
                                        <Checkbox
                                          checked={allPaid}
                                          onCheckedChange={() => 
                                            handleToggleAllPatientSessions(
                                              patientSessions.map(s => s.id),
                                              allPaid
                                            )
                                          }
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm md:text-base truncate">{patient.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Vencimento: dia {patient.payment_day} • {patientSessions.length} sessões
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between md:flex-col md:items-end md:text-right gap-2 md:space-y-1">
                                      <p className="font-semibold text-sm md:text-base">
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                      {getStatusBadge(allPaid)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Por Período */}
                      <AccordionItem value="per_period" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">Por Período</span>
                            <Badge variant="secondary">{groupedByScheme.per_period.length} pacientes</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-3">
                          {groupedByScheme.per_period.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum paciente com pagamento por período
                            </p>
                          ) : (
                            groupedByScheme.per_period.map(({ patient, sessions: patientSessions }) => {
                              const allPaid = patientSessions.every(s => s.paid);
                              const totalValue = patientSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
                              const periodInfo = `${patientSessions.length}/${patient.payment_period_sessions} sessões`;
                              
                              return (
                                <div key={patient.id} className="border rounded-lg p-3 md:p-4 space-y-2">
                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2">
                                        <Checkbox
                                          checked={allPaid}
                                          onCheckedChange={() => 
                                            handleToggleAllPatientSessions(
                                              patientSessions.map(s => s.id),
                                              allPaid
                                            )
                                          }
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm md:text-base truncate">{patient.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {periodInfo} • A cada {patient.payment_period_sessions} sessões
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between md:flex-col md:items-end md:text-right gap-2 md:space-y-1">
                                      <p className="font-semibold text-sm md:text-base">
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                      {getStatusBadge(allPaid)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Por Sessão */}
                      <AccordionItem value="per_session" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">Por Sessão</span>
                            <Badge variant="secondary">{groupedByScheme.per_session.length} sessões</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-3">
                          {groupedByScheme.per_session.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma sessão com pagamento individual
                            </p>
                          ) : (
                            groupedByScheme.per_session.map((session) => (
                              <div key={session.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Checkbox
                                      checked={session.paid}
                                      onCheckedChange={() => handleTogglePaid(session.id, session.paid)}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{session.patient?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <p className="font-semibold text-sm">
                                      R$ {Number(session.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {getStatusBadge(session.paid)}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transferências Tab */}
            <TabsContent value="transferencias">
              <TransfersTable />
            </TabsContent>

            {/* Configurações PIX Tab */}
            <TabsContent value="configuracoes" className="space-y-6">
              <PixKeyForm />
              <PixQrCodeGenerator />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
