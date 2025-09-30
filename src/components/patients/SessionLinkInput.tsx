import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Video, Link, ExternalLink, Star, RefreshCw, Trash2, Check, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import googleMeetCopyLink from "@/assets/google-meet-copy-link.gif";

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
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  // Função para detectar se é código do Google Meet (10 letras/números com hífens)
  const isGoogleMeetCode = (input: string): boolean => {
    const cleaned = input.replace(/[-\s]/g, "");
    return /^[a-zA-Z0-9]{10}$/.test(cleaned);
  };

  // Função para extrair código de uma URL do Google Meet
  const extractMeetCodeFromUrl = (input: string): string | null => {
    // Remove quebras de linha e espaços extras para facilitar a busca
    const cleanInput = input.replace(/\s+/g, ' ').trim();
    
    // Busca por padrões de URL do Google Meet (com ou sem https://)
    const urlPattern = /(?:https?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]{12})/i;
    const match = cleanInput.match(urlPattern);
    return match ? match[1] : null;
  };

  // Função para processar input (aceita código, URL ou texto completo com link)
  const processMeetInput = (input: string): string | null => {
    const trimmed = input.trim();
    
    // Tenta extrair de URL primeiro (funciona mesmo com texto ao redor)
    const fromUrl = extractMeetCodeFromUrl(trimmed);
    if (fromUrl) return fromUrl;
    
    // Se não encontrou URL, verifica se é apenas um código válido
    if (isGoogleMeetCode(trimmed)) {
      return formatGoogleMeetCode(trimmed);
    }
    
    return null;
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

  const handleGenerateRecurringLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Se não tem código, mostrar instruções PRIMEIRO
    if (!meetCodeInput.trim()) {
      setShowInstructions(true);
      return;
    }
    
    setIsGenerating(true);
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const processedCode = processMeetInput(meetCodeInput);
    if (processedCode) {
      onRecurringMeetCodeChange(processedCode);
      onLinkTypeChange('recurring_meet');
      toast({
        title: "Link recorrente configurado!",
        description: "O link do Google Meet foi salvo com sucesso.",
      });
    } else {
      toast({
        title: "Código inválido",
        description: "Por favor, cole um código ou link válido do Google Meet.",
        variant: "destructive",
      });
    }
    
    setIsGenerating(false);
    setMeetCodeInput("");
  };

  const handleOpenGoogleMeet = () => {
    window.open('https://meet.google.com/new', '_blank');
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
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
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
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
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
    <>
      <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Video className="h-5 w-5 text-primary" />
              Como salvar o link da sua sala do Google Meet
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 text-left">
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs sm:text-sm text-left">
                  Clique no botão abaixo para abrir uma nova sala do Google Meet. Depois, siga os passos:
                </AlertDescription>
              </Alert>
              
              <div className="my-4 rounded-lg border-2 border-primary/20 overflow-hidden">
                <img 
                  src={googleMeetCopyLink} 
                  alt="Tela do Google Meet mostrando onde copiar o link"
                  className="w-full"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Copie o link da reunião</p>
                    <p className="text-muted-foreground">
                      Você verá um link como <span className="font-mono text-xs">meet.google.com/xxx-yyyy-zzz</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Clique no botão de copiar</p>
                    <p className="text-muted-foreground">
                      Clique no ícone <Copy className="inline h-3 w-3" /> ao lado do link para copiá-lo
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Cole o link no perfil</p>
                    <p className="text-muted-foreground">
                      Clique no botão <strong>Colar</strong> e depois em <strong>Confirmar</strong> para associar o link ao paciente.
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="border-secondary/30 bg-secondary/10">
                <AlertDescription className="text-xs sm:text-sm text-secondary-foreground text-left leading-relaxed">
                  <strong>Como funciona:</strong> Chega de enviar um link novo a cada sessão! Configure um link do Meet uma única vez no perfil do paciente. O Tera IA o torna permanente e cuida do resto: envia automaticamente nos lembretes, elimina retrabalho e garante consistência que melhora a adesão. Mantenha o link ativo realizando ao menos uma sessão a cada 30 dias. Reutilize links da sua agenda ou crie um específico para cada paciente.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenGoogleMeet();
                setShowInstructions(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white order-2 sm:order-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Google Meet
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowInstructions(false);
              }}
              className="order-1 sm:order-2"
            >
              Fechar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
      
      {/* Google Meet - Opção principal */}
      <Card className="p-3 sm:p-4 border-2 bg-gradient-to-r from-secondary/10 to-accent/5 border-secondary/30">
        <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
          <Video className="h-4 w-4 text-secondary shrink-0" />
          <span className="font-medium text-sm sm:text-base">Google Meet Recorrente</span>
          <Badge variant="secondary" className="bg-secondary/15 text-secondary-foreground border-secondary/30">
            <Star className="h-3 w-3 mr-1" />
            Recomendado
          </Badge>
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
          💡 <strong>Facilite sua rotina:</strong> Torne um um link permanente para eliminar o retrabalho e automatizar lembretes inteligentes.
        </p>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={meetCodeInput}
              onChange={(e) => setMeetCodeInput(e.target.value)}
              placeholder="abc-def-ghij ou link completo"
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && meetCodeInput.trim()) {
                  e.preventDefault();
                  handleGenerateRecurringLink(e as any);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePasteCode();
              }}
              className="shrink-0 w-full sm:w-auto"
              title="Colar do clipboard"
            >
              Colar
            </Button>
          </div>
          
          <Button
            type="button"
            onClick={handleGenerateRecurringLink}
            disabled={isGenerating}
            className="w-full h-10 sm:h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs sm:text-sm px-3"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 shrink-0 animate-spin" />
                <span className="truncate">Gerando...</span>
              </>
            ) : meetCodeInput.trim() ? (
              <>
                <Check className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Confirmar Link</span>
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Criar Nova Sala no Meet</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Link Externo - Opção alternativa */}
      <div className="text-center px-2">
        <div className="text-xs text-muted-foreground mb-2">ou</div>
        <Button
          variant="outline"
          onClick={handleSetExternalLink}
          className="text-xs sm:text-sm px-3 max-w-full"
        >
          <Link className="h-3 w-3 mr-2 shrink-0" />
          <span className="truncate">Usar link externo (Zoom, Teams, etc.)</span>
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
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (externalSessionLink) {
                    window.open(externalSessionLink, '_blank');
                  }
                }}
                disabled={!externalSessionLink || !externalSessionLink.startsWith('http')}
                className="flex-1 text-xs sm:text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Testar Link</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveExternalLink}
                className="sm:w-auto text-xs sm:text-sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
      </div>
    </>
  );
};

export default SessionLinkInput;