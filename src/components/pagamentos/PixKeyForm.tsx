import { useState, useEffect } from "react";
import { QrCode, Copy, CheckCircle2, Key, CreditCard, Info, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { TipoCobranca } from "@/hooks/useProfile";
import { createStaticPix } from 'pix-utils';

type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'random';

export function PixKeyForm() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();
  const [keyType, setKeyType] = useState<PixKeyType>('email');
  const [keyValue, setKeyValue] = useState('');
  const [copiedCopyPaste, setCopiedCopyPaste] = useState(false);
  const [tipoCobranca, setTipoCobranca] = useState<TipoCobranca>('DIA_FIXO');
  const [parametroCobranca, setParametroCobranca] = useState(10);

  useEffect(() => {
    if (profile) {
      setKeyType((profile.pix_key_type as PixKeyType) || 'email');
      setKeyValue(profile.pix_key_value || '');
      setTipoCobranca((profile.tipo_cobranca as TipoCobranca) || 'DIA_FIXO');
      setParametroCobranca(profile.parametro_cobranca || 10);
    }
  }, [profile]);

  const savePixConfig = () => {
    if (!keyValue || !profile?.name) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos antes de salvar a chave PIX",
        variant: "destructive",
      });
      return;
    }

    try {
      // Gerar código PIX copia e cola usando pix-utils
      const pixCode = createStaticPix({
        merchantName: profile.name,
        merchantCity: profile.city || 'Sao Paulo',
        pixKey: keyValue,
        infoAdicional: 'Pagamento de terapia',
        txid: 'TERAPIA' + Date.now(),
        transactionAmount: 0, // Valor zero para QR Code reutilizável
      });

      // Verificar se houve erro na geração
      if ('error' in pixCode) {
        throw new Error('Erro ao gerar código PIX');
      }

      updateProfile({
        pix_key_type: keyType,
        pix_key_value: keyValue,
        pix_copy_paste: pixCode.toBRCode(),
        pix_qr_code: pixCode.toBRCode(), // Mesmo código serve para QR Code
        pix_updated_at: new Date().toISOString(),
      });

      toast({
        title: "Chave PIX salva",
        description: "Código PIX gerado com sucesso e pronto para receber pagamentos",
      });
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código PIX. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const savePaymentPreferences = () => {
    try {
      updateProfile({
        tipo_cobranca: tipoCobranca,
        parametro_cobranca: parametroCobranca,
      });

      toast({
        title: "Preferências salvas",
        description: "Suas preferências de cobrança foram atualizadas",
      });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCopyPaste(true);
    setTimeout(() => setCopiedCopyPaste(false), 2000);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência",
    });
  };

  const getKeyTypeMask = (type: PixKeyType) => {
    switch (type) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      case 'telefone':
        return '+55 (00) 00000-0000';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Configuração de Chave PIX */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Key className="h-5 w-5" />
            Configurar Chave PIX
          </CardTitle>
          <CardDescription className="text-sm">
            Configure sua chave PIX para receber pagamentos dos seus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pix-type">Tipo de Chave</Label>
              <Select value={keyType} onValueChange={(value) => setKeyType(value as PixKeyType)}>
                <SelectTrigger id="pix-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Input
                id="pix-key"
                placeholder={getKeyTypeMask(keyType) || `Digite sua chave ${keyType}`}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={savePixConfig} disabled={isUpdating || !keyValue} className="w-full">
            {isUpdating ? "Salvando..." : "Salvar Chave PIX"}
          </Button>

          {profile?.pix_copy_paste && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Código PIX Copia e Cola</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded border break-all">
                    {profile.pix_copy_paste}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.pix_copy_paste || '');
                      toast({
                        title: "Copiado!",
                        description: "Código PIX copiado para a área de transferência",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Chave PIX: {profile.pix_key_value}</p>
                {profile?.pix_updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {new Date(profile.pix_updated_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Preferências de Recebimento */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <CreditCard className="h-5 w-5" />
            Preferências de Recebimento
          </CardTitle>
          <CardDescription className="text-sm">
            Configure como deseja gerenciar os recebimentos dos seus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 md:p-6">
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
                value={tipoCobranca} 
                onValueChange={(value: TipoCobranca) => setTipoCobranca(value)}
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
                {tipoCobranca === "DIA_FIXO" && "Dia do Vencimento"}
                {tipoCobranca === "PACOTE_SESSOES" && "Quantidade de Sessões"}
                {tipoCobranca === "POR_SESSAO" && "Dias de Antecedência"}
              </Label>
              <Input
                id="parametro_cobranca"
                type="number"
                value={parametroCobranca}
                onChange={(e) => setParametroCobranca(Number(e.target.value))}
                placeholder="10"
                min="1"
                max={tipoCobranca === "DIA_FIXO" ? "31" : "365"}
              />
            </div>
          </div>
          
          <div className="bg-gradient-subtle p-4 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como funciona:
            </h4>
            <div className="text-sm text-muted-foreground">
              {tipoCobranca === "DIA_FIXO" && (
                <p>Os pacientes serão cobrados todo dia {parametroCobranca} do mês, independente da quantidade de sessões.</p>
              )}
              {tipoCobranca === "POR_SESSAO" && (
                <p>Uma cobrança será gerada {parametroCobranca} dias antes de cada sessão agendada.</p>
              )}
              {tipoCobranca === "PACOTE_SESSOES" && (
                <p>Os pacientes pagam por pacotes de {parametroCobranca} sessões antecipadamente.</p>
              )}
            </div>
          </div>

          <Button onClick={savePaymentPreferences} disabled={isUpdating} className="w-full">
            {isUpdating ? "Salvando..." : "Salvar Preferências de Recebimento"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
