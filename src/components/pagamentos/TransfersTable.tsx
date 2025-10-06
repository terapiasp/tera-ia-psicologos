import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePaymentTransfers } from "@/hooks/usePaymentTransfers";
import { usePatients } from "@/hooks/usePatients";

export function TransfersTable() {
  const currentMonth = new Date();
  const { transfers, isLoading } = usePaymentTransfers(
    startOfMonth(currentMonth),
    endOfMonth(currentMonth)
  );
  const { patients } = usePatients();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const patient = patients.find(p => p.id === transfer.patient_id);
      const searchLower = searchTerm.toLowerCase();
      
      return (
        patient?.name.toLowerCase().includes(searchLower) ||
        transfer.sender_name?.toLowerCase().includes(searchLower) ||
        transfer.reference?.toLowerCase().includes(searchLower)
      );
    });
  }, [transfers, patients, searchTerm]);

  const stats = useMemo(() => {
    const total = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
    const pending = transfers.filter(t => t.validation_status === 'pending').length;
    const divergent = transfers.filter(t => t.validation_status === 'divergent').length;
    
    return { total, pending, divergent };
  }, [transfers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-200 text-amber-700">Pendente</Badge>;
      case 'divergent':
        return <Badge variant="destructive">Divergência</Badge>;
      case 'manual':
        return <Badge variant="secondary">Manual</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transfers.length} transferências
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              transferências pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Divergências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.divergent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transferências de {format(currentMonth, "MMMM", { locale: ptBR })}</CardTitle>
              <CardDescription>
                Histórico de transferências PIX recebidas
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Transferência
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, origem ou referência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando transferências...
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma transferência registrada</p>
              <p className="text-sm mt-1">
                As transferências recebidas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => {
                    const patient = patients.find(p => p.id === transfer.patient_id);
                    
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {format(new Date(transfer.transfer_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{patient?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {transfer.reference || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{transfer.sender_name || '-'}</p>
                            {transfer.sender_bank && (
                              <p className="text-xs text-muted-foreground">{transfer.sender_bank}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {Number(transfer.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transfer.validation_status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
