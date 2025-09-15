import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreditCard, Info, Plus, DollarSign } from "lucide-react";
import { TipoCobranca } from "@/hooks/useProfile";
import { useServiceModalities } from "@/hooks/useServiceModalities";

interface BillingSectionProps {
  formData: {
    tipo_cobranca: TipoCobranca;
    parametro_cobranca: number;
  };
  onInputChange: (field: string, value: string | number) => void;
  onSubmit: () => void;
  isUpdating: boolean;
}

export const BillingSection = ({ formData, onInputChange, onSubmit, isUpdating }: BillingSectionProps) => {
  const { modalities, isLoading: modalitiesLoading } = useServiceModalities();

  const calculateMonthlyEstimate = () => {
    const totalValue = modalities.reduce((sum, mod) => sum + (mod.session_value || 0), 0);
    const avgSessionsPerWeek = 20; // Estimativa baseada em dados típicos
    const weeksPerMonth = 4.33;
    
    switch (formData.tipo_cobranca) {
      case "DIA_FIXO":
        return totalValue * avgSessionsPerWeek * weeksPerMonth;
      case "POR_SESSAO":
        return totalValue * avgSessionsPerWeek * weeksPerMonth;
      case "PACOTE_SESSOES":
        return totalValue * formData.parametro_cobranca;
      default:
        return 0;
    }
  };

  const terapiaSPCommission = modalities.find(mod => mod.type === "terapia_sp");

  return (
    <div className="space-y-6">
      {/* Configuração de Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Preferências de Cobrança
          </CardTitle>
          <CardDescription>
            Configure como deseja gerenciar os pagamentos dos seus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_cobranca" className="flex items-center gap-2">
                Tipo de Cobrança
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Escolha como seus pacientes serão cobrados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select 
                value={formData.tipo_cobranca} 
                onValueChange={(value: TipoCobranca) => onInputChange("tipo_cobranca", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIA_FIXO">Dia Fixo do Mês</SelectItem>
                  <SelectItem value="POR_SESSAO">Por Sessão</SelectItem>
                  <SelectItem value="PACOTE_SESSOES">Pacote de Sessões</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parametro_cobranca">
                {formData.tipo_cobranca === "DIA_FIXO" && "Dia do Vencimento"}
                {formData.tipo_cobranca === "PACOTE_SESSOES" && "Quantidade de Sessões"}
                {formData.tipo_cobranca === "POR_SESSAO" && "Dias de Antecedência"}
              </Label>
              <Input
                id="parametro_cobranca"
                type="number"
                value={formData.parametro_cobranca}
                onChange={(e) => onInputChange("parametro_cobranca", Number(e.target.value))}
                placeholder="10"
                min="1"
                max={formData.tipo_cobranca === "DIA_FIXO" ? "31" : "365"}
              />
            </div>
          </div>
          
          <div className="bg-gradient-subtle p-4 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como funciona:
            </h4>
            <div className="text-sm text-muted-foreground">
              {formData.tipo_cobranca === "DIA_FIXO" && (
                <p>Os pacientes serão cobrados todo dia {formData.parametro_cobranca} do mês, independente da quantidade de sessões.</p>
              )}
              {formData.tipo_cobranca === "POR_SESSAO" && (
                <p>Uma cobrança será gerada {formData.parametro_cobranca} dias antes de cada sessão agendada.</p>
              )}
              {formData.tipo_cobranca === "PACOTE_SESSOES" && (
                <p>Os pacientes pagam por pacotes de {formData.parametro_cobranca} sessões antecipadamente.</p>
              )}
            </div>
          </div>

          {/* Estimativa de Receita */}
          <div className="bg-success/5 border border-success/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-success">
              <DollarSign className="h-4 w-4" />
              Estimativa de Receita Mensal
            </h4>
            <p className="text-2xl font-bold text-success">
              R$ {calculateMonthlyEstimate().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Baseado nas suas modalidades de serviço e frequência média
            </p>
          </div>

          <Button 
            onClick={onSubmit}
            disabled={isUpdating}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isUpdating ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </CardContent>
      </Card>

      {/* Modalidades de Serviço */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modalidades de Serviço</CardTitle>
              <CardDescription>
                Gerencie os tipos de atendimento e valores praticados
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Modalidade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modalitiesLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-muted animate-pulse rounded-md" />
              <div className="h-12 bg-muted animate-pulse rounded-md" />
            </div>
          ) : modalities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma modalidade configurada</p>
              <p className="text-sm">Adicione modalidades para organizar seus atendimentos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modalities.map((modality) => (
                <div key={modality.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{modality.name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{modality.type.replace('_', ' ')}</p>
                    </div>
                    {modality.type === "terapia_sp" && (
                      <Badge variant="secondary">Terapia SP</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {(modality.session_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {modality.commission_value && (
                      <p className="text-sm text-muted-foreground">
                        Repasse: R$ {modality.commission_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informações sobre Terapia SP */}
          {terapiaSPCommission && (
            <>
              <Separator className="my-4" />
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-primary">Repasses Automáticos - Terapia SP</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Atendimento Quinzenal</p>
                    <p className="font-medium">R$ 20,00 por sessão</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Atendimento Semanal</p>
                    <p className="font-medium">R$ 40,00 por sessão</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Os repasses são processados automaticamente após cada atendimento confirmado
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};