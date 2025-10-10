import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Copy, QrCode, Key } from "lucide-react";
import { useQuickPix } from "@/hooks/useQuickPix";
import { useSessionValues } from "@/hooks/useSessionValues";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const QuickPixGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { quickPix, isLoading: isLoadingQuickPix, createQuickPix, deleteQuickPix } = useQuickPix();
  const { sessionValues } = useSessionValues();
  
  const [selectedKeyType, setSelectedKeyType] = useState("");
  const [selectedKeyValue, setSelectedKeyValue] = useState("");
  const [selectedPixCode, setSelectedPixCode] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Fetch PIX keys from pix_payments (chaves configuradas com pix_code)
  const { data: pixKeys } = useQuery({
    queryKey: ['pix-keys-for-quick', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      
      const { data, error } = await supabase
        .from('pix_payments')
        .select('id, pix_key_type, pix_key_value, pix_code, receiver_name')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: true })
        .limit(2);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  // Pre-select primary PIX key and its pix_code
  useEffect(() => {
    if (pixKeys && pixKeys.length > 0 && !selectedKeyType) {
      const primaryKey = pixKeys[0];
      if (primaryKey.pix_code) {
        setSelectedKeyType(primaryKey.pix_key_type || '');
        setSelectedKeyValue(primaryKey.pix_key_value || '');
        setSelectedPixCode(primaryKey.pix_code);
      }
    }
  }, [pixKeys, selectedKeyType]);

  // Calculate suggested amounts based on session values
  const suggestedAmounts = () => {
    if (sessionValues.length === 0) return [];
    
    const amounts = new Set<number>();
    
    // Add top 2 most common values
    sessionValues.slice(0, 2).forEach(sv => {
      amounts.add(sv.value);
    });
    
    // Add multiples for weekly (x2) and biweekly (x4)
    sessionValues.slice(0, 2).forEach(sv => {
      amounts.add(sv.value * 2);
      amounts.add(sv.value * 4);
    });
    
    return Array.from(amounts).sort((a, b) => a - b);
  };

  const handleGenerate = () => {
    if (!selectedKeyType || !selectedKeyValue || !selectedPixCode || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a chave PIX e o valor.",
        variant: "destructive",
      });
      return;
    }

    console.log('Gerando PIX Rápido com:', {
      pix_key_type: selectedKeyType,
      pix_key_value: selectedKeyValue,
      pix_code: selectedPixCode,
      amount: parseFloat(amount),
      description: description || undefined,
    });

    createQuickPix.mutate({
      pix_key_type: selectedKeyType,
      pix_key_value: selectedKeyValue,
      pix_code: selectedPixCode,
      amount: parseFloat(amount),
      description: description || undefined,
    });
  };

  const handleCopyPixCode = () => {
    if (quickPix?.pix_code) {
      navigator.clipboard.writeText(quickPix.pix_code);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      });
    }
  };

  const handleNewGeneration = () => {
    if (quickPix?.id) {
      deleteQuickPix.mutate(quickPix.id);
    }
    setAmount("");
    setDescription("");
  };

  // No PIX key configured
  if (!pixKeys || pixKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            PIX Rápido
          </CardTitle>
          <CardDescription>
            Configure uma chave PIX para gerar cobranças rápidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/pagamentos?tab=pix-config')} variant="outline">
            <Key className="h-4 w-4 mr-2" />
            Configurar Chave PIX
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          PIX Rápido
        </CardTitle>
        <CardDescription>
          Gere cobranças rápidas sem associar a pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!quickPix || !quickPix.qr_code_url ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Select
                value={selectedKeyValue}
                onValueChange={(value) => {
                  const selectedKey = pixKeys.find(k => k.pix_key_value === value);
                  if (selectedKey && selectedKey.pix_code) {
                    console.log('Chave PIX selecionada:', selectedKey);
                    setSelectedKeyType(selectedKey.pix_key_type || '');
                    setSelectedKeyValue(selectedKey.pix_key_value || '');
                    setSelectedPixCode(selectedKey.pix_code);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a chave PIX" />
                </SelectTrigger>
                <SelectContent>
                  {pixKeys.map((key, index) => (
                    <SelectItem key={key.id} value={key.pix_key_value || ''}>
                      {index === 0 ? 'Principal' : 'Alternativa'}: {key.pix_key_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Digite o valor"
              />
              {suggestedAmounts().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedAmounts().map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(value.toString())}
                    >
                      R$ {value.toFixed(2)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional, máx. 25 caracteres)</Label>
              <Input
                id="description"
                maxLength={25}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Sessão de terapia"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/25 caracteres
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={createQuickPix.isPending}
              className="w-full"
            >
              {createQuickPix.isPending ? "Gerando..." : "Gerar PIX Rápido"}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex justify-center">
                {quickPix.qr_code_url ? (
                  <img
                    src={quickPix.qr_code_url}
                    alt="QR Code PIX"
                    className="w-64 h-64 border rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {quickPix.pix_code && (
                <div className="space-y-2">
                  <Label>Código PIX</Label>
                  <div className="flex gap-2">
                    <Input
                      value={quickPix.pix_code}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={handleCopyPixCode}
                      variant="outline"
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-semibold">R$ {quickPix.amount}</p>
                </div>
                {quickPix.description && (
                  <div>
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="font-semibold">{quickPix.description}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleNewGeneration}
                variant="outline"
                className="w-full"
              >
                Gerar Outro
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
