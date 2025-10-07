import { useState, useEffect } from "react";
import { Key, CreditCard, Info, Trash2, Eye, Edit, CheckCircle2, QrCode, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'random';

const BRAZILIAN_BANKS = [
  { value: "001", label: "Banco do Brasil" },
  { value: "033", label: "Santander" },
  { value: "104", label: "Caixa Econômica Federal" },
  { value: "237", label: "Bradesco" },
  { value: "341", label: "Itaú" },
  { value: "077", label: "Banco Inter" },
  { value: "260", label: "Nubank" },
  { value: "290", label: "PagSeguro (PagBank)" },
  { value: "323", label: "Mercado Pago" },
  { value: "336", label: "C6 Bank" },
  { value: "422", label: "Banco Safra" },
  { value: "748", label: "Sicredi" },
  { value: "756", label: "Sicoob" },
  { value: "212", label: "Banco Original" },
  { value: "041", label: "Banrisul" },
  { value: "outro", label: "Outro" },
];

export function PixKeyForm() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [city, setCity] = useState('');
  const [bank, setBank] = useState('');
  const [customBank, setCustomBank] = useState('');
  const [keyType, setKeyType] = useState<PixKeyType>('email');
  const [keyValue, setKeyValue] = useState('');
  const [tipoCobranca, setTipoCobranca] = useState<TipoCobranca>('DIA_FIXO');
  const [parametroCobranca, setParametroCobranca] = useState(10);
  const [copiedCode, setCopiedCode] = useState(false);

  // Buscar PIX padrão do psicólogo
  const { data: defaultPixPayment, refetch: refetchPixPayment } = useQuery({
    queryKey: ['default-pix-payment', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      
      const { data, error } = await supabase
        .from('pix_payments')
        .select('*')
        .eq('user_id', profile.user_id)
        .is('patient_id', null)
        .is('session_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id && !!profile?.pix_key_value,
    refetchInterval: (query) => {
      // Se ainda não tem QR Code, recarrega a cada 3 segundos
      const data = query.state.data;
      if (data && !data.qr_code_url) return 3000;
      return false;
    },
  });

  useEffect(() => {
    if (profile) {
      setCity(profile.city || '');
      setBank(profile.pix_bank_name || '');
      setKeyType((profile.pix_key_type as PixKeyType) || 'email');
      setKeyValue(profile.pix_key_value || '');
      setTipoCobranca((profile.tipo_cobranca as TipoCobranca) || 'DIA_FIXO');
      setParametroCobranca(profile.parametro_cobranca || 10);
      
      // Se não tem chave configurada, entra em modo edição
      if (!profile.pix_key_value) {
        setIsEditing(true);
      }
    }
  }, [profile]);

  const formatPixKey = (value: string, type: PixKeyType): string => {
    // Remove tudo que não é número ou letra
    let cleaned = value.replace(/[^\w@.+-]/g, '');
    
    switch (type) {
      case 'cpf':
        // Remove tudo que não é número
        cleaned = cleaned.replace(/\D/g, '');
        // Aplica máscara XXX.XXX.XXX-XX
        if (cleaned.length <= 11) {
          cleaned = cleaned.replace(/(\d{3})(\d)/, '$1.$2');
          cleaned = cleaned.replace(/(\d{3})(\d)/, '$1.$2');
          cleaned = cleaned.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return cleaned.slice(0, 14);
      
      case 'cnpj':
        // Remove tudo que não é número
        cleaned = cleaned.replace(/\D/g, '');
        // Aplica máscara XX.XXX.XXX/XXXX-XX
        if (cleaned.length <= 14) {
          cleaned = cleaned.replace(/(\d{2})(\d)/, '$1.$2');
          cleaned = cleaned.replace(/(\d{3})(\d)/, '$1.$2');
          cleaned = cleaned.replace(/(\d{3})(\d)/, '$1/$2');
          cleaned = cleaned.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        return cleaned.slice(0, 18);
      
      case 'telefone':
        // Remove tudo que não é número
        cleaned = cleaned.replace(/\D/g, '');
        // Aplica máscara +55 (XX) XXXXX-XXXX
        if (cleaned.length <= 13) {
          if (!cleaned.startsWith('55')) {
            cleaned = '55' + cleaned;
          }
          cleaned = cleaned.replace(/(\d{2})(\d)/, '+$1 ($2');
          cleaned = cleaned.replace(/(\d{2})\)(\d)/, '$1) $2');
          cleaned = cleaned.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return cleaned.slice(0, 19);
      
      case 'email':
        return value.toLowerCase();
      
      case 'random':
        return value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
      
      default:
        return value;
    }
  };

  const validatePixKey = (value: string, type: PixKeyType): boolean => {
    switch (type) {
      case 'cpf':
        const cpf = value.replace(/\D/g, '');
        return cpf.length === 11;
      case 'cnpj':
        const cnpj = value.replace(/\D/g, '');
        return cnpj.length === 14;
      case 'telefone':
        const phone = value.replace(/\D/g, '');
        return phone.length === 13;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'random':
        return value.length >= 32;
      default:
        return false;
    }
  };

  const handleKeyValueChange = (value: string) => {
    const formatted = formatPixKey(value, keyType);
    setKeyValue(formatted);
  };

  const savePixConfig = async () => {
    // Validação de campos obrigatórios
    if (!city.trim()) {
      toast({
        title: "Cidade obrigatória",
        description: "Por favor, informe a cidade em que reside",
        variant: "destructive",
      });
      return;
    }

    if (!bank) {
      toast({
        title: "Banco obrigatório",
        description: "Por favor, selecione sua instituição bancária",
        variant: "destructive",
      });
      return;
    }

    if (bank === 'outro' && !customBank.trim()) {
      toast({
        title: "Nome do banco obrigatório",
        description: "Por favor, informe o nome da instituição bancária",
        variant: "destructive",
      });
      return;
    }

    if (!keyValue.trim()) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Por favor, informe sua chave PIX",
        variant: "destructive",
      });
      return;
    }

    // Validação específica do tipo de chave
    if (!validatePixKey(keyValue, keyType)) {
      toast({
        title: "Chave PIX inválida",
        description: `A chave informada não é válida para o tipo ${keyType}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const bankName = bank === 'outro' ? customBank : BRAZILIAN_BANKS.find(b => b.value === bank)?.label || bank;
      
      // Atualizar perfil
      await updateProfile({
        city: city.trim(),
        pix_bank_name: bankName,
        pix_key_type: keyType,
        pix_key_value: keyValue,
        pix_updated_at: new Date().toISOString(),
      });

      // Criar PIX padrão do psicólogo (sem valor, sem paciente)
      if (profile?.user_id) {
        const { error: pixError } = await supabase
          .from('pix_payments')
          .insert({
            user_id: profile.user_id,
            patient_id: null,
            session_id: null,
            pix_key_value: keyValue,
            pix_key_type: keyType,
            receiver_name: profile.name,
            city: city.trim(),
            pix_bank_name: bankName,
            amount: '0.00',
            description: '***',
            status: 'pending',
          });

        if (pixError) {
          console.error('Erro ao criar PIX padrão:', pixError);
        } else {
          // Recarregar o PIX payment
          setTimeout(() => refetchPixPayment(), 1000);
        }
      }

      toast({
        title: "Chave PIX salva",
        description: "Sua chave PIX foi configurada. Aguarde a geração do QR Code...",
      });
      
      // Sai do modo edição após salvar
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a chave PIX. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePixKey = async () => {
    try {
      // Excluir o PIX padrão do banco
      if (profile?.user_id) {
        const { error: deleteError } = await supabase
          .from('pix_payments')
          .delete()
          .eq('user_id', profile.user_id)
          .is('patient_id', null)
          .is('session_id', null);

        if (deleteError) {
          console.error('Erro ao excluir PIX padrão:', deleteError);
        }
      }

      await updateProfile({
        city: null,
        pix_bank_name: null,
        pix_key_type: null,
        pix_key_value: null,
        pix_updated_at: null,
      });

      toast({
        title: "Chave PIX excluída",
        description: "Sua configuração PIX foi removida",
      });

      // Limpa os campos e volta para modo edição
      setCity('');
      setBank('');
      setCustomBank('');
      setKeyType('email');
      setKeyValue('');
      setIsEditing(true);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Erro ao excluir chave PIX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a chave PIX",
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

  const handleCopyPixCode = () => {
    if (defaultPixPayment?.pix_code) {
      navigator.clipboard.writeText(defaultPixPayment.pix_code);
      setCopiedCode(true);
      toast({
        title: "Código copiado",
        description: "O código PIX foi copiado para a área de transferência",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getKeyPlaceholder = (type: PixKeyType) => {
    switch (type) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      case 'telefone':
        return '+55 (00) 00000-0000';
      case 'email':
        return 'seu@email.com';
      case 'random':
        return 'Chave aleatória (32 caracteres)';
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
        <CardContent className="p-4 md:p-6">
          {!isEditing && profile?.pix_key_value ? (
            // Estado Configurado - View compacto com QR Code
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-full">
                    <Key className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">Chave PIX Configurada</h4>
                      <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {profile.pix_bank_name} • {profile.pix_key_type?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDetailsDialog(true)}
                    className="h-9 w-9"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-9 w-9"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-9 w-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code e Código Copia e Cola */}
              {defaultPixPayment && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Sua Chave PIX Padrão</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Use este QR Code e código para receber pagamentos sem valor específico
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {defaultPixPayment.qr_code_url ? (
                      <>
                        {/* QR Code */}
                        <div className="flex justify-center p-4 bg-white rounded-lg border">
                          <img 
                            src={defaultPixPayment.qr_code_url} 
                            alt="QR Code PIX"
                            className="w-48 h-48 object-contain"
                          />
                        </div>

                        {/* Código Copia e Cola */}
                        {defaultPixPayment.pix_code && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Código Copia e Cola</Label>
                            <div className="flex gap-2">
                              <Input
                                value={defaultPixPayment.pix_code}
                                readOnly
                                className="font-mono text-xs"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyPixCode}
                                className="shrink-0"
                              >
                                {copiedCode ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="animate-pulse space-y-2">
                          <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            Gerando QR Code PIX...
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            Isso pode levar alguns segundos
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Estado de Edição - Formulário completo
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="city">
                  Cidade em que reside <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">
                  Instituição Bancária <span className="text-destructive">*</span>
                </Label>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_BANKS.map((bankOption) => (
                      <SelectItem key={bankOption.value} value={bankOption.value}>
                        {bankOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {bank === 'outro' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-bank">
                    Nome do Banco <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="custom-bank"
                    placeholder="Digite o nome da instituição"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pix-type">
                    Tipo de Chave <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={keyType} 
                    onValueChange={(value) => {
                      setKeyType(value as PixKeyType);
                      setKeyValue(''); // Limpa o campo ao trocar o tipo
                    }}
                  >
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
                  <Label htmlFor="pix-key">
                    Chave PIX <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pix-key"
                    placeholder={getKeyPlaceholder(keyType)}
                    value={keyValue}
                    onChange={(e) => handleKeyValueChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {profile?.pix_key_value && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  onClick={savePixConfig} 
                  disabled={isUpdating || !city || !bank || !keyValue || (bank === 'outro' && !customBank)} 
                  className="flex-1"
                >
                  {isUpdating ? "Salvando..." : "Salvar Chave PIX"}
                </Button>
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

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Chave PIX?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua configuração PIX? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePixKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Detalhes da Chave PIX */}
      <AlertDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Detalhes da Chave PIX
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Cidade</Label>
              <p className="font-medium mt-1">{profile?.city || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Instituição Bancária</Label>
              <p className="font-medium mt-1">{profile?.pix_bank_name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo de Chave</Label>
              <p className="font-medium mt-1">{profile?.pix_key_type?.toUpperCase() || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Chave PIX</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded border">
                  {profile?.pix_key_value || '-'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(profile?.pix_key_value || '');
                    toast({
                      title: "Copiado!",
                      description: "Chave PIX copiada para a área de transferência",
                    });
                  }}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {profile?.pix_updated_at && (
              <div>
                <Label className="text-muted-foreground">Última Atualização</Label>
                <p className="text-sm mt-1">
                  {new Date(profile.pix_updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
