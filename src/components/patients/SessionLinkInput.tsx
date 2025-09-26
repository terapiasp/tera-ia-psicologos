import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Video, Link, ExternalLink, Star, RefreshCw, Trash2, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionLinkInputProps {
  recurringMeetCode?: string;
  externalSessionLink?: string;
  linkType?: 'recurring_meet' | 'external' | null;
  onRecurringMeetCodeChange: (value: string) => void;
  onExternalLinkChange: (value: string) => void;
  onLinkTypeChange: (value: 'recurring_meet' | 'external' | null) => void;
  className?: string;
  autoFocus?: boolean;
}

const SessionLinkInput: React.FC<SessionLinkInputProps> = ({
  recurringMeetCode = "",
  externalSessionLink = "",
  linkType,
  onRecurringMeetCodeChange,
  onExternalLinkChange,
  onLinkTypeChange,
  className,
  autoFocus = false,
}) => {
  const [meetCodeInput, setMeetCodeInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Função para detectar se é código do Google Meet (10 letras/números com hífens)
  const isGoogleMeetCode = (input: string): boolean => {
    const cleaned = input.replace(/[-\s]/g, "");
    return /^[a-zA-Z0-9]{10}$/.test(cleaned);
  };

  // Função para formatar código do Google Meet
  const formatGoogleMeetCode = (code: string): string => {
    const cleaned = code.replace(/[-\s]/g, "");
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Função para converter código em link completo
  const convertMeetCodeToLink = (code: string): string => {
    const formatted = formatGoogleMeetCode(code);
    return `https://meet.google.com/${formatted}`;
  };

  const handleGenerateRecurringLink = async () => {
    if (!meetCodeInput.trim()) return;
    
    setIsGenerating(true);
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cleanCode = meetCodeInput.trim();
    if (isGoogleMeetCode(cleanCode)) {
      const formatted = formatGoogleMeetCode(cleanCode);
      onRecurringMeetCodeChange(formatted);
      onLinkTypeChange('recurring_meet');
    }
    
    setIsGenerating(false);
    setMeetCodeInput("");
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMeetCodeInput(text.trim());
    } catch (err) {
      // Fallback silencioso se clipboard não funcionar
    }
  };

  const handleRemoveRecurringLink = () => {
    onRecurringMeetCodeChange("");
    onLinkTypeChange(null);
  };

  const handleSetExternalLink = () => {
    onLinkTypeChange('external');
    onRecurringMeetCodeChange("");
  };

  const handleRemoveExternalLink = () => {
    onExternalLinkChange("");
    onLinkTypeChange(null);
  };

  const getMeetLinkPreview = () => {
    if (linkType === 'recurring_meet' && recurringMeetCode && isGoogleMeetCode(recurringMeetCode)) {
      return convertMeetCodeToLink(recurringMeetCode);
    }
    return null;
  };

  // Se já tem link recorrente ativo, mostrar estado compacto
  if (linkType === 'recurring_meet' && recurringMeetCode) {
    const generatedLink = convertMeetCodeToLink(recurringMeetCode);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Video className="h-4 w-4 text-primary" />
          Google Meet
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            OK
          </Badge>
        </div>
        
        <Card className="p-4 bg-primary/5 border-2 border-primary">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground mb-1">
                💡 Mesmo link sempre ativo. Se usado dentro de 30 dias, permanece indefinidamente.
              </div>
              <Button
                variant="ghost"
                className="h-auto p-0 text-left justify-start text-primary hover:text-primary/80"
                onClick={() => window.open(generatedLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate font-mono text-sm">{generatedLink}</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(generatedLink);
                  toast({
                    title: "Link copiado!",
                    description: "Link da sessão copiado para área de transferência",
                  });
                }}
                className="h-8 px-2"
                title="Copiar link"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveRecurringLink}
                className="h-8 px-2"
                title="Remover link recorrente"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetExternalLink}
          className="text-xs"
        >
          Usar link externo em vez disso
        </Button>
      </div>
    );
  }

  // Se já tem link externo ativo, mostrar estado compacto
  if (linkType === 'external' && externalSessionLink) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link className="h-4 w-4 text-primary" />
          Link Externo
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            OK
          </Badge>
        </div>
        
        <Card className="p-4 bg-primary/5 border-2 border-primary">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground mb-1">💡 Link sempre ativo quando configurado.</div>
              <Button
                variant="ghost"
                className="h-auto p-0 text-left justify-start text-primary hover:text-primary/80"
                onClick={() => window.open(externalSessionLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate text-sm">{externalSessionLink}</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(externalSessionLink);
                  toast({
                    title: "Link copiado!",
                    description: "Link da sessão copiado para área de transferência",
                  });
                }}
                className="h-8 px-2"
                title="Copiar link"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveExternalLink}
                className="h-8 px-2"
                title="Remover link externo"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLinkTypeChange(null)}
          className="text-xs"
        >
          Usar Google Meet em vez disso
        </Button>
      </div>
    );
  }

  // Estado de configuração inicial
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Link de Sessão</div>
      
      {/* Google Meet - Opção principal */}
      <Card className="p-4 border-2 border-green-200 bg-green-50/50">
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-4 w-4 text-green-700" />
          <span className="font-medium text-green-900">Google Meet Recorrente</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            <Star className="h-3 w-3 mr-1" />
            Recomendado
          </Badge>
        </div>
        
        <p className="text-sm text-green-700 mb-4">
          💡 <strong>Mantenha o mesmo link sempre ativo.</strong> Se usado dentro de 30 dias, permanece indefinidamente.
        </p>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={meetCodeInput}
              onChange={(e) => setMeetCodeInput(e.target.value)}
              placeholder="Cole aqui o código: abc-def-ghij"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && meetCodeInput.trim()) {
                  handleGenerateRecurringLink();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={handlePasteCode}
              className="shrink-0"
              title="Colar do clipboard"
            >
              Colar
            </Button>
          </div>
          
          <Button
            onClick={handleGenerateRecurringLink}
            disabled={!meetCodeInput.trim() || isGenerating}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando link recorrente...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Gerar Link Recorrente
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Link Externo - Opção alternativa */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-2">ou</div>
        <Button
          variant="outline"
          onClick={handleSetExternalLink}
          className="text-sm"
        >
          <Link className="h-3 w-3 mr-2" />
          Usar link externo (Zoom, Teams, etc.)
        </Button>
      </div>

      {/* Input para link externo se selecionado */}
      {linkType === 'external' && (
        <Card className="p-4 border-2 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Link className="h-4 w-4 text-blue-700" />
            <span className="font-medium text-blue-900">Link Externo</span>
          </div>
          
          <div className="space-y-3">
            <Input
              value={externalSessionLink}
              onChange={(e) => onExternalLinkChange(e.target.value)}
              placeholder="https://zoom.us/j/123456789"
              className="w-full"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={() => externalSessionLink && window.open(externalSessionLink, '_blank')}
                disabled={!externalSessionLink || !externalSessionLink.startsWith('http')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Testar Link
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveExternalLink}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SessionLinkInput;