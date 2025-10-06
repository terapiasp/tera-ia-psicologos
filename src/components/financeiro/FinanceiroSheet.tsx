import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Filter
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface FinanceiroSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'pending' | 'paid';

export function FinanceiroSheet({ open, onOpenChange }: FinanceiroSheetProps) {
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
    onError: (error) => {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header fixo */}
        <SheetHeader className="p-6 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <SheetTitle className="text-xl">
                Receita de {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Resumo Geral */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Previsto</p>
              <p className="text-lg font-bold text-foreground">
                R$ {stats.predicted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-lg font-bold text-green-600">
                R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-lg font-bold text-amber-600">
                R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pendentes
            </Button>
            <Button
              size="sm"
              variant={filter === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilter('paid')}
            >
              Pagos
            </Button>
          </div>
        </SheetHeader>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
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
                          <div key={patient.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={allPaid}
                                    onCheckedChange={() => 
                                      handleToggleAllPatientSessions(
                                        patientSessions.map(s => s.id),
                                        allPaid
                                      )
                                    }
                                  />
                                  <div>
                                    <p className="font-medium">{patient.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Vencimento: dia {patient.payment_day} • {patientSessions.length} sessões
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-semibold">
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
                          <div key={patient.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={allPaid}
                                    onCheckedChange={() => 
                                      handleToggleAllPatientSessions(
                                        patientSessions.map(s => s.id),
                                        allPaid
                                      )
                                    }
                                  />
                                  <div>
                                    <p className="font-medium">{patient.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {periodInfo} • A cada {patient.payment_period_sessions} sessões
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-semibold">
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}