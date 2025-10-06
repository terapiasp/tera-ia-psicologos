import { useState, useEffect } from "react";
import { QrCode, Copy, CheckCircle2, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
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

  const generatePixCode = () => {
    if (!keyValue || !profile?.name) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos antes de salvar a chave PIX",
        variant: "destructive",
      });
      return;
    }

    try {
      updateProfile({
        pix_key_type: keyType,
        pix_key_value: keyValue,
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

          <Button onClick={generatePixCode} disabled={isUpdating || !keyValue} className="w-full">
            {isUpdating ? "Salvando..." : "Salvar Chave PIX"}
          </Button>

          {profile?.pix_key_value && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
