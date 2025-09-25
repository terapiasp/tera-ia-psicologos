import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Video, Link, Check, Clock, AlertTriangle, Star } from "lucide-react";

interface SessionLinkInputProps {
  recurringMeetCode?: string;
  externalSessionLink?: string;
  linkType?: 'recurring_meet' | 'external' | null;
  onRecurringMeetCodeChange: (value: string) => void;
  onExternalLinkChange: (value: string) => void;
  onLinkTypeChange: (value: 'recurring_meet' | 'external' | null) => void;
  className?: string;
}

const SessionLinkInput: React.FC<SessionLinkInputProps> = ({
  recurringMeetCode = "",
  externalSessionLink = "",
  linkType,
  onRecurringMeetCodeChange,
  onExternalLinkChange,
  onLinkTypeChange,
  className,
}) => {
  const [meetCodeDisplay, setMeetCodeDisplay] = useState("");

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

  // Sincronizar o display do código meet
  useEffect(() => {
    if (recurringMeetCode) {
      setMeetCodeDisplay(formatGoogleMeetCode(recurringMeetCode));
    } else {
      setMeetCodeDisplay("");
    }
  }, [recurringMeetCode]);

  const handleMeetCodeChange = (inputValue: string) => {
    setMeetCodeDisplay(inputValue);
    
    // Se é um código válido do Google Meet, salvar formatado
    if (isGoogleMeetCode(inputValue)) {
      const formatted = formatGoogleMeetCode(inputValue);
      onRecurringMeetCodeChange(formatted);
    } else {
      onRecurringMeetCodeChange(inputValue);
    }
  };

  const handleMeetCodePaste = () => {
    navigator.clipboard.readText().then((text) => {
      const cleanText = text.trim();
      if (isGoogleMeetCode(cleanText)) {
        const formatted = formatGoogleMeetCode(cleanText);
        setMeetCodeDisplay(formatted);
        onRecurringMeetCodeChange(formatted);
      } else {
        setMeetCodeDisplay(cleanText);
        onRecurringMeetCodeChange(cleanText);
      }
    });
  };

  const handleLinkTypeChange = (value: string) => {
    if (value === 'recurring_meet' || value === 'external') {
      onLinkTypeChange(value);
      // Limpar o outro campo
      if (value === 'recurring_meet') {
        onExternalLinkChange("");
      } else {
        onRecurringMeetCodeChange("");
        setMeetCodeDisplay("");
      }
    } else {
      onLinkTypeChange(null);
    }
  };

  const getMeetLinkPreview = () => {
    if (linkType === 'recurring_meet' && recurringMeetCode && isGoogleMeetCode(recurringMeetCode)) {
      return convertMeetCodeToLink(recurringMeetCode);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={linkType || ""} onValueChange={handleLinkTypeChange}>
        {/* Google Meet - Recomendado */}
        <Card className={`p-4 border-2 transition-colors ${
          linkType === 'recurring_meet' 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-muted-foreground/30'
        }`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="recurring_meet" id="recurring_meet" />
            <Label htmlFor="recurring_meet" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-4 w-4" />
                <span className="font-medium">Link Recorrente Google Meet</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  Recomendado
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                💡 <strong>Mantenha o mesmo link sempre ativo.</strong> Se usado dentro de 30 dias, permanece indefinidamente.
              </p>
            </Label>
          </div>
          
          {linkType === 'recurring_meet' && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={meetCodeDisplay}
                    onChange={(e) => handleMeetCodeChange(e.target.value)}
                    placeholder="ex: abc-def-ghij"
                    className="h-12 text-base pr-12"
                  />
                  
                  {isGoogleMeetCode(recurringMeetCode) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMeetCodePaste}
                  className="h-12 px-3 shrink-0"
                  title="Colar código do clipboard"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>

              {getMeetLinkPreview() && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                  <Video className="h-3 w-3" />
                  <span>Link gerado: </span>
                  <a 
                    href={getMeetLinkPreview()!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline truncate"
                  >
                    {getMeetLinkPreview()}
                  </a>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Link Externo */}
        <Card className={`p-4 border-2 transition-colors ${
          linkType === 'external' 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-muted-foreground/30'
        }`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="external" id="external" />
            <Label htmlFor="external" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Link className="h-4 w-4" />
                <span className="font-medium">Link Externo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para Zoom, Teams ou outras plataformas (link completo)
              </p>
            </Label>
          </div>
          
          {linkType === 'external' && (
            <div className="mt-3">
              <Input
                value={externalSessionLink}
                onChange={(e) => onExternalLinkChange(e.target.value)}
                placeholder="https://zoom.us/j/123456789 ou outro link completo"
                className="h-12 text-base"
              />
              
              {externalSessionLink && externalSessionLink.startsWith('http') && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Link className="h-3 w-3" />
                  <span>Link válido:</span>
                  <a 
                    href={externalSessionLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline truncate"
                  >
                    {externalSessionLink}
                  </a>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Opção sem link */}
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="" id="none" />
          <Label htmlFor="none" className="cursor-pointer text-sm text-muted-foreground">
            Não usar link de sessão
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default SessionLinkInput;