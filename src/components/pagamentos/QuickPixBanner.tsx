import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Copy, X, DollarSign, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSessionValues } from "@/hooks/useSessionValues";
import { useQuickPix } from "@/hooks/useQuickPix";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function QuickPixBanner() {
  const { profile } = useProfile();
  const { quickPix, createQuickPix, deleteQuickPix } = useQuickPix();
  const { getSuggestedValues } = useSessionValues();
  const { toast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPixKey, setSelectedPixKey] = useState<any>(null);

  const suggestedValues = getSuggestedValues();

  // Fetch configured PIX keys
  const { data: pixKeys } = useQuery({
    queryKey: ['pix-keys-configured', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      
      const { data, error } = await supabase
        .from('pix_payments')
        .select('id, pix_key_type, pix_key_value, pix_code, receiver_name, pix_bank_name')
        .eq('user_id', profile.user_id)
        .not('pix_code', 'is', null)
        .order('created_at', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  // Pre-select primary PIX key
  useEffect(() => {
    if (pixKeys && pixKeys.length > 0 && !selectedPixKey) {
      setSelectedPixKey(pixKeys[0]);
    }
  }, [pixKeys, selectedPixKey]);

  const handleSuggestedValueClick = (value: number) => {
    setSelectedAmount(value.toString());
    setCustomAmount(value.toString());
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(value);
  };

  const handleGenerate = () => {
    if (!selectedPixKey?.pix_code || !selectedAmount) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma chave PIX e informe o valor.",
        variant: "destructive",
      });
      return;
    }

    createQuickPix.mutate({
      pix_key_type: selectedPixKey.pix_key_type,
      pix_key_value: selectedPixKey.pix_key_value,
      pix_code: selectedPixKey.pix_code,
      amount: parseFloat(selectedAmount),
      description: description || undefined,
    });
  };

  const handleCopyPixCode = () => {
    if (quickPix?.pix_code) {
      navigator.clipboard.writeText(quickPix.pix_code);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
    }
  };

  const handleNewGeneration = () => {
    if (quickPix?.id) {
      deleteQuickPix.mutate(quickPix.id);
    }
    setSelectedAmount("");
    setCustomAmount("");
    setDescription("");
  };

  // No PIX keys configured
  if (!pixKeys || pixKeys.length === 0) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-border/50 rounded-lg p-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Configure sua chave PIX para gerar cobranças rápidas</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            const configTab = document.querySelector('[data-tab="configuracoes"]') as HTMLElement;
            configTab?.click();
          }}>
            Configurar Chave PIX
          </Button>
        </div>
      </div>
    );
  }

  // PIX generated - Show complete view
  if (quickPix) {
    const hasQrCode = !!quickPix.qr_code_url;
    const createdAt = new Date(quickPix.created_at).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - createdAt) / (1000 * 60);
    const isGeneratingQrCode = !hasQrCode && elapsedMinutes < 2;

    return (
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-border/50 rounded-lg p-4 mb-4 md:mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* QR Code or Loading */}
          <div className="shrink-0">
            {hasQrCode ? (
              <img 
                src={quickPix.qr_code_url} 
                alt="QR Code PIX" 
                className="w-24 h-24 md:w-28 md:h-28 rounded-md border border-border"
              />
            ) : isGeneratingQrCode ? (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-md border border-border bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-md border border-border bg-muted flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                R$ {parseFloat(String(quickPix.amount || "0")).toFixed(2)}
              </span>
              <Badge variant="secondary" className="gap-1 bg-green-600/10 text-green-600 border-green-600/20 hover:bg-green-600/10 hover:text-green-600">
                <Sparkles className="h-3 w-3" />
                PIX Rápido
              </Badge>
            </div>
            {quickPix.description && (
              <p className="text-sm text-muted-foreground">{quickPix.description}</p>
            )}
            {isGeneratingQrCode && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Gerando QR Code...
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all max-w-full">
                {quickPix.pix_code?.substring(0, 40) || ""}...
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPixCode}
                className="shrink-0"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar Código
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNewGeneration}
              className="hover:bg-green-600/10 hover:text-green-600"
            >
              Gerar Outro
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNewGeneration}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default state - Generation form
  return (
    <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-border/50 rounded-lg p-4 mb-4 md:mb-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-foreground">PIX Rápido</h3>
        </div>

        {/* Suggested values - Up to 6, wrapped in 2 rows on mobile */}
        {suggestedValues.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Valores comuns:</span>
            <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2">
              {suggestedValues.map((value) => (
                <Badge
                  key={value}
                  variant={selectedAmount === value.toString() ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors text-center justify-center"
                  onClick={() => handleSuggestedValueClick(value)}
                >
                  R$ {value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* PIX Key selector */}
          <div className="md:col-span-3">
            <label className="text-xs text-muted-foreground mb-1 block">Chave PIX</label>
            <Select
              value={selectedPixKey?.pix_key_value || ""}
              onValueChange={(value) => {
                const key = pixKeys.find(k => k.pix_key_value === value);
                if (key) setSelectedPixKey(key);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {pixKeys.map((key, index) => {
                  const priority = index === 0 ? "principal" : "alternativa";
                  const typeMap: Record<string, string> = {
                    cpf: "CPF",
                    cnpj: "CNPJ",
                    email: "Email",
                    telefone: "Telefone",
                    aleatoria: "Aleatória"
                  };
                  const type = typeMap[key.pix_key_type] || key.pix_key_type;
                  const institution = key.pix_bank_name || "Banco";
                  
                  return (
                    <SelectItem key={key.id} value={key.pix_key_value}>
                      <span className="font-semibold">{priority}</span> {type} {institution}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Custom amount */}
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0,00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="h-9 pl-8"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-4">
            <label className="text-xs text-muted-foreground mb-1 block">
              Descrição (opcional) 
              <span className="ml-2 text-xs">
                {description.length}/25
              </span>
            </label>
            <Input
              placeholder="Ex: Sessão de terapia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={25}
              className="h-9"
            />
          </div>

          {/* Generate button */}
          <div className="md:col-span-3">
            <Button
              onClick={handleGenerate}
              disabled={!selectedPixKey || !selectedAmount || createQuickPix.isPending}
              className="w-full h-9 bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {createQuickPix.isPending ? "Gerando..." : "Gerar PIX"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
