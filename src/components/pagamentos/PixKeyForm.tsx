import { useState, useEffect } from "react";
import { QrCode, Copy, CheckCircle2, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { createStaticPix, hasError } from "pix-utils";

type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'random';

export function PixKeyForm() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();
  const [keyType, setKeyType] = useState<PixKeyType>('email');
  const [keyValue, setKeyValue] = useState('');
  const [copiedCopyPaste, setCopiedCopyPaste] = useState(false);

  useEffect(() => {
    if (profile) {
      setKeyType((profile.pix_key_type as PixKeyType) || 'email');
      setKeyValue(profile.pix_key_value || '');
    }
  }, [profile]);

  const generatePixCode = async () => {
    if (!keyValue || !profile?.name) {
      toast({
        title: "Dados incompletos",
        description: "Preencha sua chave PIX e certifique-se de ter um nome cadastrado no perfil",
        variant: "destructive",
      });
      return;
    }

    try {
      const pix = createStaticPix({
        merchantName: profile.name,
        merchantCity: profile.city || 'Sao Paulo',
        pixKey: keyValue,
        infoAdicional: 'Terapia SP',
        transactionAmount: 0, // Static PIX without predefined amount
      });

      if (hasError(pix)) {
        throw new Error('Erro ao gerar código PIX');
      }

      const brCode = pix.toBRCode();
      const qrCodeDataUrl = await pix.toImage();

      updateProfile({
        pix_key_type: keyType,
        pix_key_value: keyValue,
        pix_copy_paste: brCode,
        pix_qr_code: qrCodeDataUrl,
        pix_updated_at: new Date().toISOString(),
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar código PIX",
        description: "Verifique se os dados estão corretos",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurar Chave PIX
          </CardTitle>
          <CardDescription>
            Configure sua chave PIX para receber pagamentos. O QR Code será gerado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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

          <Button onClick={generatePixCode} disabled={isUpdating || !keyValue}>
            {isUpdating ? "Gerando..." : "Gerar Código PIX"}
          </Button>

          {profile?.pix_updated_at && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(profile.pix_updated_at).toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      {profile?.pix_copy_paste && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Código PIX Gerado
            </CardTitle>
            <CardDescription>
              Use este código para receber pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.pix_qr_code && (
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <img 
                  src={profile.pix_qr_code} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input
                  value={profile.pix_copy_paste}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(profile.pix_copy_paste!)}
                >
                  {copiedCopyPaste ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este código com seus pacientes para receberem pagamentos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
