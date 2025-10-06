import { useState, useEffect } from "react";
import { QrCode, Copy, CheckCircle2, Key, CreditCard, Info, DollarSign, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { TipoCobranca } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'random';

export function PixKeyForm() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [keyType, setKeyType] = useState<PixKeyType>('email');
  const [keyValue, setKeyValue] = useState('');
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [pixCity, setPixCity] = useState('');
  const [copiedCopyPaste, setCopiedCopyPaste] = useState(false);
  const [tipoCobranca, setTipoCobranca] = useState<TipoCobranca>('DIA_FIXO');
  const [parametroCobranca, setParametroCobranca] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const mainBanks = [
    'Nubank',
    'Banco do Brasil',
    'Bradesco',
    'Itaú',
    'Caixa Econômica Federal',
    'Santander',
    'Inter',
    'BTG Pactual',
    'Banco Original',
    'Neon',
    'C6 Bank',
    'PagBank',
    'Mercado Pago',
    'Banco Safra',
    'Sicredi',
  ];

  useEffect(() => {
    if (profile) {
      setKeyType((profile.pix_key_type as PixKeyType) || 'email');
      setKeyValue(profile.pix_key_value || '');
      const savedBank = profile.pix_bank_name || '';
      if (mainBanks.includes(savedBank)) {
        setBankName(savedBank);
        setCustomBankName('');
      } else if (savedBank) {
        setBankName('Outros');
        setCustomBankName(savedBank);
      } else {
        setBankName('');
        setCustomBankName('');
      }
      setPixCity(profile.city || '');
      setTipoCobranca((profile.tipo_cobranca as TipoCobranca) || 'DIA_FIXO');
      setParametroCobranca(profile.parametro_cobranca || 10);
    }
  }, [profile]);

  const formatPixKey = (value: string, type: PixKeyType): string => {
    if (type === 'cpf') {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    }
    
    if (type === 'cnpj') {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
    }
    
    if (type === 'telefone') {
      return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '+55 ($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
        .substring(0, 20);
    }
    
    return value;
  };

  const savePixConfig = () => {
    if (!keyValue || !profile?.name || !pixCity) {
      toast({
        title: "Dados incompletos",
        description: "Preencha chave PIX, nome e cidade antes de salvar",
        variant: "destructive",
      });
      return;
    }

    try {
      const cleanedValue = keyValue.replace(/\D/g, '');
      const finalBankName = bankName === 'Outros' ? customBankName : bankName;
      updateProfile({
        pix_key_type: keyType,
        pix_key_value: keyType === 'email' || keyType === 'random' ? keyValue : cleanedValue,
        pix_bank_name: finalBankName,
        city: pixCity,
        pix_updated_at: new Date().toISOString(),
      });

      toast({
        title: "Chave PIX salva",
        description: "Sua chave PIX foi configurada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a chave PIX. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const generatePixCode = async () => {
    if (!profile?.name || !pixCity) {
      toast({
        title: "Dados incompletos",
        description: "Preencha nome e cidade antes de gerar o código PIX",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.pix_key_value) {
      toast({
        title: "Chave PIX não configurada",
        description: "Configure sua chave PIX antes de gerar o código",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pix', {
        body: {
          profileId: profile.id,
        }
      });

      if (error) throw error;

      toast({
        title: "Código PIX gerado!",
        description: "Seu código PIX está pronto para uso",
      });

      queryClient.invalidateQueries({ queryKey: ['profile'] });

    } catch (error: any) {
      console.error('Erro ao gerar código PIX:', error);
      toast({
        title: "Erro ao gerar código",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
                onChange={(e) => {
                  const formatted = formatPixKey(e.target.value, keyType);
                  setKeyValue(formatted);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank-name">
                Instituição Bancária
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <Info className="h-4 w-4 text-muted-foreground inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nome do seu banco</p>
                      <p className="text-xs mt-1">Útil para verificação de pagamentos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger id="bank-name">
                  <SelectValue placeholder="Selecione seu banco" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {mainBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              
              {bankName === 'Outros' && (
                <Input
                  placeholder="Digite o nome do banco"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-city">
                Cidade <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <Info className="h-4 w-4 text-muted-foreground inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cidade que aparecerá no código PIX (obrigatório BACEN)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="pix-city"
                placeholder="Ex: São Paulo"
                value={pixCity}
                onChange={(e) => setPixCity(e.target.value)}
                required
              />
            </div>
          </div>

          <Button onClick={savePixConfig} disabled={isUpdating || !keyValue || !pixCity} className="w-full">
            {isUpdating ? "Salvando..." : "Salvar Configuração PIX"}
          </Button>

          {profile?.pix_key_value && (
            <>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Chave PIX Configurada</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border">
                    {profile.pix_key_value}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.pix_key_value || '');
                      toast({
                        title: "Copiado!",
                        description: "Chave PIX copiada para a área de transferência",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {profile?.pix_updated_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última atualização: {new Date(profile.pix_updated_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Gerar Código PIX
                  </CardTitle>
                  <CardDescription>
                    Gere um código PIX copia-e-cola válido para receber pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={generatePixCode} 
                    disabled={isGenerating || !profile?.name || !pixCity}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando código...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Gerar Código PIX
                      </>
                    )}
                  </Button>

                  {(!profile?.name || !pixCity) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {!profile?.name && "Complete seu nome nas Configurações. "}
                        {!pixCity && "Informe a cidade no formulário acima."}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {profile?.pix_copy_paste && (
                <Card className="border-success/50 bg-success/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      Código PIX Gerado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile?.pix_qr_code && (
                      <div className="flex justify-center">
                        <img 
                          src={profile.pix_qr_code} 
                          alt="QR Code PIX" 
                          className="w-64 h-64 border-2 border-border rounded-lg"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Código Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input
                          value={profile.pix_copy_paste}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(profile.pix_copy_paste!)}
                        >
                          {copiedCopyPaste ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        ✅ Este código não expira e aceita qualquer valor<br />
                        📱 Compartilhe com seus pacientes para receber pagamentos
                      </AlertDescription>
                    </Alert>

                    {profile?.pix_updated_at && (
                      <p className="text-xs text-muted-foreground text-center">
                        Gerado em: {new Date(profile.pix_updated_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
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
