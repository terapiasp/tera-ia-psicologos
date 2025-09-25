import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Link, Check } from "lucide-react";

interface SessionLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SessionLinkInput: React.FC<SessionLinkInputProps> = ({
  value,
  onChange,
  placeholder = "Código do Meet ou link completo",
  className,
}) => {
  const [linkType, setLinkType] = useState<"meet" | "general" | null>(null);
  const [displayValue, setDisplayValue] = useState("");

  // Função para detectar se é código do Google Meet (10 letras/números com hífens)
  const isGoogleMeetCode = (input: string): boolean => {
    // Remove hífens e espaços para verificar se são apenas letras/números
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

  // Função para extrair código do link do Google Meet
  const extractMeetCodeFromLink = (link: string): string => {
    const match = link.match(/meet\.google\.com\/([a-zA-Z0-9-]{12})/);
    return match ? match[1] : "";
  };

  useEffect(() => {
    if (!value) {
      setLinkType(null);
      setDisplayValue("");
      return;
    }

    // Se é um link completo do Google Meet
    if (value.includes("meet.google.com")) {
      setLinkType("meet");
      const code = extractMeetCodeFromLink(value);
      setDisplayValue(code || value);
    }
    // Se é um código do Google Meet
    else if (isGoogleMeetCode(value)) {
      setLinkType("meet");
      setDisplayValue(formatGoogleMeetCode(value));
    }
    // Se é um link geral
    else if (value.startsWith("http")) {
      setLinkType("general");
      setDisplayValue(value);
    }
    // Texto livre (pode estar digitando código do Meet)
    else {
      setLinkType(null);
      setDisplayValue(value);
    }
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue);

    // Se está digitando um código do Google Meet
    if (isGoogleMeetCode(inputValue)) {
      const fullLink = convertMeetCodeToLink(inputValue);
      onChange(fullLink);
    } else {
      onChange(inputValue);
    }
  };

  const handleMeetCodePaste = () => {
    navigator.clipboard.readText().then((text) => {
      const cleanText = text.trim();
      if (isGoogleMeetCode(cleanText)) {
        const fullLink = convertMeetCodeToLink(cleanText);
        onChange(fullLink);
      } else {
        setDisplayValue(cleanText);
        onChange(cleanText);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={`h-12 text-base pr-20 ${className || ""}`}
          />
          
          {linkType && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {linkType === "meet" ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Video className="h-3 w-3 mr-1" />
                  Meet
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                  <Link className="h-3 w-3 mr-1" />
                  Link
                </Badge>
              )}
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

      {linkType === "meet" && value && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Video className="h-3 w-3" />
          <span>Link: </span>
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline truncate"
          >
            {value}
          </a>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <strong>Google Meet:</strong> Cole apenas o código (ex: abc-def-ghij)</p>
        <p>• <strong>Outros:</strong> Cole o link completo (Zoom, Teams, etc.)</p>
      </div>
    </div>
  );
};

export default SessionLinkInput;