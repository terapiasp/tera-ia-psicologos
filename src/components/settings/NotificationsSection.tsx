import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Eye, Info, MessageSquare } from "lucide-react";

interface NotificationsSectionProps {
  formData: {
    template_lembrete_sessao: string;
    template_lembrete_pagamento: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isUpdating: boolean;
}

export const NotificationsSection = ({ formData, onInputChange, onSubmit, isUpdating }: NotificationsSectionProps) => {
  const [previewType, setPreviewType] = useState<'sessao' | 'pagamento'>('sessao');

  const variables = {
    sessao: [
      { key: '{{paciente}}', description: 'Nome do paciente' },
      { key: '{{data_hora}}', description: 'Data e hora da sessão' },
      { key: '{{psicologo}}', description: 'Seu nome' },
      { key: '{{clinica}}', description: 'Nome da clínica' },
    ],
    pagamento: [
      { key: '{{paciente}}', description: 'Nome do paciente' },
      { key: '{{vencimento}}', description: 'Data de vencimento' },
      { key: '{{valor}}', description: 'Valor do pagamento' },
      { key: '{{psicologo}}', description: 'Seu nome' },
    ],
  };

  const generatePreview = (template: string, type: 'sessao' | 'pagamento') => {
    const sampleData = {
      sessao: {
        '{{paciente}}': 'Maria Silva',
        '{{data_hora}}': '15/03/2024 às 14:00',
        '{{psicologo}}': 'Dr. João Santos',
        '{{clinica}}': 'Consultório Bem-Estar',
      },
      pagamento: {
        '{{paciente}}': 'Maria Silva',
        '{{vencimento}}': '20/03/2024',
        '{{valor}}': 'R$ 150,00',
        '{{psicologo}}': 'Dr. João Santos',
      },
    };

    let preview = template;
    Object.entries(sampleData[type]).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value);
    });

    return preview;
  };

  const validateTemplate = (template: string, type: 'sessao' | 'pagamento') => {
    const requiredVars = type === 'sessao' ? ['{{paciente}}', '{{data_hora}}'] : ['{{paciente}}', '{{vencimento}}'];
    const errors = [];

    requiredVars.forEach(variable => {
      if (!template.includes(variable)) {
        errors.push(`Variável obrigatória ${variable} não encontrada`);
      }
    });

    return errors;
  };

  return (
    <div className="space-y-6">
      {/* Templates de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Templates de Notificação
          </CardTitle>
          <CardDescription>
            Personalize as mensagens automáticas enviadas aos seus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template de Lembrete de Sessão */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="template_sessao" className="text-base font-medium">
                Lembrete de Sessão
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewType('sessao')}
                className={previewType === 'sessao' ? 'bg-muted' : ''}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            
            <Textarea
              id="template_sessao"
              value={formData.template_lembrete_sessao}
              onChange={(e) => onInputChange("template_lembrete_sessao", e.target.value)}
              placeholder="Digite sua mensagem de lembrete de sessão..."
              rows={4}
              className="font-mono text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {variables.sessao.map((variable) => (
                <TooltipProvider key={variable.key}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => {
                          const textarea = document.getElementById('template_sessao') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + variable.key + text.substring(end);
                            onInputChange("template_lembrete_sessao", newText);
                          }
                        }}
                      >
                        {variable.key}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{variable.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {validateTemplate(formData.template_lembrete_sessao, 'sessao').map((error, index) => (
              <p key={index} className="text-sm text-destructive flex items-center gap-2">
                <Info className="h-4 w-4" />
                {error}
              </p>
            ))}
          </div>

          <Separator />

          {/* Template de Lembrete de Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="template_pagamento" className="text-base font-medium">
                Lembrete de Pagamento
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewType('pagamento')}
                className={previewType === 'pagamento' ? 'bg-muted' : ''}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            
            <Textarea
              id="template_pagamento"
              value={formData.template_lembrete_pagamento}
              onChange={(e) => onInputChange("template_lembrete_pagamento", e.target.value)}
              placeholder="Digite sua mensagem de lembrete de pagamento..."
              rows={4}
              className="font-mono text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {variables.pagamento.map((variable) => (
                <TooltipProvider key={variable.key}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => {
                          const textarea = document.getElementById('template_pagamento') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + variable.key + text.substring(end);
                            onInputChange("template_lembrete_pagamento", newText);
                          }
                        }}
                      >
                        {variable.key}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{variable.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {validateTemplate(formData.template_lembrete_pagamento, 'pagamento').map((error, index) => (
              <p key={index} className="text-sm text-destructive flex items-center gap-2">
                <Info className="h-4 w-4" />
                {error}
              </p>
            ))}
          </div>

          <Button 
            onClick={onSubmit}
            disabled={isUpdating}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isUpdating ? "Salvando..." : "Salvar Templates"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview em Tempo Real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Preview da Mensagem
          </CardTitle>
          <CardDescription>
            Veja como sua mensagem ficará para os pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-subtle border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={previewType === 'sessao' ? 'default' : 'secondary'}>
                {previewType === 'sessao' ? 'Lembrete de Sessão' : 'Lembrete de Pagamento'}
              </Badge>
            </div>
            <div className="bg-background p-3 rounded border">
              <p className="whitespace-pre-wrap">
                {previewType === 'sessao' 
                  ? generatePreview(formData.template_lembrete_sessao, 'sessao')
                  : generatePreview(formData.template_lembrete_pagamento, 'pagamento')
                }
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Este é um exemplo com dados fictícios
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};