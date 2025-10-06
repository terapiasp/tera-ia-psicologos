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

  return (
    <div className="space-y-6">
      {/* Placeholder para Configurações Futuras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuração de Pagamentos
          </CardTitle>
          <CardDescription>
            Configurações de cobrança e repasses da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-subtle p-8 rounded-lg border text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Em Breve</h3>
            <p className="text-muted-foreground">
              Aqui ficará a configuração de pagamento pela plataforma TERA IA e repasse de pacientes Terapia SP.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Configure suas preferências de recebimento em <strong>Pagamentos → Configurações PIX</strong>
            </p>
          </div>
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
          {modalities.find(mod => mod.type === "terapia_sp") && (
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