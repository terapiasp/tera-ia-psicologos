import { useState } from "react";
import { QrCode, DollarSign, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { usePatients } from "@/hooks/usePatients";
import { useSessions } from "@/hooks/useSessions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function PixQrCodeGenerator() {
  const { profile } = useProfile();
  const { patients } = usePatients();
  const currentMonth = new Date();
  const { sessions } = useSessions(startOfMonth(currentMonth), endOfMonth(currentMonth));
  const { toast } = useToast();
  
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const activePatients = patients.filter(p => !p.is_archived);
  const patientSessions = selectedPatient 
    ? sessions.filter(s => s.patient_id === selectedPatient && !s.paid)
    : [];

  const selectedPatientData = activePatients.find(p => p.id === selectedPatient);
  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  const handleGenerateQrCode = async () => {
    // Validações
    if (!profile?.pix_key_value) {
      toast({
        title: "Configuração Pendente",
        description: "Configure sua chave PIX antes de gerar QR Codes",
        variant: "destructive",
      });
      return;
    }

    if (!profile.city) {
      toast({
        title: "Cidade Obrigatória",
        description: "Configure sua cidade nas configurações PIX",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPatient) {
      toast({
        title: "Paciente Obrigatório",
        description: "Selecione um paciente para gerar o QR Code",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor Inválido",
        description: "Informe um valor válido para o pagamento",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase
        .from('pix_payments')
        .insert({
          user_id: profile.user_id,
          patient_id: selectedPatient,
          session_id: selectedSession || null,
          pix_key_value: profile.pix_key_value,
          receiver_name: profile.name,
          city: profile.city,
          pix_bank_name: profile.pix_bank_name || '',
          amount: parseFloat(amount),
          description: description || `Pagamento ${selectedPatientData?.name}`,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "QR Code Solicitado",
        description: "O QR Code PIX está sendo gerado. Aguarde alguns instantes...",
      });

      // Limpar formulário
      setSelectedPatient("");
      setSelectedSession("");
      setAmount("");
      setDescription("");

    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o QR Code PIX",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-preencher valor quando sessão é selecionada
  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session?.value) {
      setAmount(session.value.toString());
      setDescription(`Sessão de ${format(new Date(session.scheduled_at), 'dd/MM/yyyy')}`);
    }
  };

  if (!profile?.pix_key_value) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Configure sua chave PIX primeiro</p>
              <p className="text-sm text-amber-700 mt-1">
                Para gerar QR Codes PIX, você precisa configurar sua chave PIX acima.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <QrCode className="h-5 w-5" />
          Gerar QR Code PIX
        </CardTitle>
        <CardDescription className="text-sm">
          Crie QR Codes PIX para receber pagamentos dos seus pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">
              Paciente <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {activePatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {patient.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && patientSessions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="session">Sessão (opcional)</Label>
              <Select value={selectedSession} onValueChange={handleSessionChange}>
                <SelectTrigger id="session">
                  <SelectValue placeholder="Vincular a uma sessão específica" />
                </SelectTrigger>
                <SelectContent>
                  {patientSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm")} - R$ {session.value?.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">
              Valor (R$) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Sessão de terapia - Janeiro 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={handleGenerateQrCode} 
            disabled={isGenerating || !selectedPatient || !amount}
            className="w-full"
          >
            {isGenerating ? "Gerando QR Code..." : "Gerar QR Code PIX"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
