import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, X, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

export const GoogleCalendarSection = () => {
  const { toast } = useToast();
  const { 
    isConnected, 
    isLoading, 
    connectCalendar, 
    disconnectCalendar, 
    isConnecting, 
    isDisconnecting 
  } = useGoogleCalendar();

  const handleConnect = async () => {
    try {
      await connectCalendar();
    } catch (error: any) {
      toast({
        title: "Erro ao conectar",
        description: error.message || "Não foi possível conectar com o Google Calendar",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectCalendar();
      toast({
        title: "Google Calendar desconectado",
        description: "A sincronização foi desabilitada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message || "Não foi possível desconectar do Google Calendar",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
          {isConnected ? (
            <Badge variant="outline" className="text-success border-success">
              <Check className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <X className="h-3 w-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Sincronize automaticamente suas sessões com o Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status e Informações */}
        <div className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                <Check className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <h4 className="font-medium text-success">Sincronização Ativa</h4>
                  <p className="text-sm text-muted-foreground">
                    Suas sessões estão sendo sincronizadas automaticamente com o Google Calendar
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium">O que é sincronizado:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-success" />
                    Sessões agendadas, reagendadas e canceladas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-success" />
                    Nome do paciente e horário da sessão
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-success" />
                    Anotações e observações da sessão
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium">Sincronização Desabilitada</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecte sua conta do Google para sincronizar sessões automaticamente
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Benefícios da sincronização:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Visualizar sessões em qualquer dispositivo
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Receber notificações do Google
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Integração com outros aplicativos
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Ações */}
        <div className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://calendar.google.com", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Google Calendar
                </Button>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Desconectar Google Calendar
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Conectar Google Calendar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Nota de Privacidade */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <strong>Privacidade:</strong> Apenas as informações básicas das sessões (data, hora, paciente) 
              são sincronizadas. Informações sensíveis como prontuários e dados pessoais detalhados 
              permanecem apenas na Tera IA.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};