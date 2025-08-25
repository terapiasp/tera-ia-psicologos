import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, DollarSign, Repeat, Trash2, MapPin, Eye, Settings, MessageCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MoveConfirmationPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'move';
  session: Session | null;
  patient?: Patient | null;
  onConfirm: (moveType: 'single' | 'series') => void;
  onDelete?: () => void;
}

export const MoveConfirmationPopover: React.FC<MoveConfirmationPopoverProps> = ({
  open,
  onOpenChange,
  mode,
  session,
  patient: patientData,
  onConfirm,
  onDelete,
}) => {
  if (!session) return null;

  const isRecurring = !!session.schedule_id;
  const sessionDate = new Date(session.scheduled_at);
  const sessionPatient = session.patients;

  const { toast } = useToast();

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getModalityDisplay = (modality: string | null | undefined) => {
    const modalityMap: Record<string, string> = {
      'online': 'Online',
      'presencial': 'Presencial',
      'hibrido': 'Híbrido'
    };
    return modalityMap[modality || ''] || 'Não informado';
  };

  const getFrequencyDisplay = (frequency: string | null | undefined) => {
    const frequencyMap: Record<string, string> = {
      'semanal': 'Semanal',
      'weekly': 'Semanal',
      'quinzenal': 'Quinzenal',
      'biweekly': 'Quinzenal',
      'mensal': 'Mensal',
      'monthly': 'Mensal',
    };
    return frequencyMap[frequency || ''] || 'Não informado';
  };

  const getTherapyTypeDisplay = (therapyType: string | null | undefined) => {
    const therapyTypeMap: Record<string, string> = {
      'individual_adult': 'Adulto Individual',
      'individual_teen': 'Adolescente Individual',
      'individual_child': 'Infantil Individual',
      'couple_therapy': 'Terapia de Casal',
      'family_therapy': 'Terapia Familiar',
      'group_therapy': 'Terapia em Grupo',
    };
    return therapyTypeMap[therapyType || ''] || therapyType || 'Não informado';
  };

  const normalizePhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return '';
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    
    // Se tem 10 ou 11 dígitos e não começa com 55, adiciona o código do Brasil
    if (digits.length === 10 || digits.length === 11) {
      if (!digits.startsWith('55')) {
        return '55' + digits;
      }
    }
    
    // Se já tem 12-13 dígitos e começa com 55, retorna como está
    if (digits.length >= 12 && digits.startsWith('55')) {
      return digits;
    }
    
    // Para outros casos, assume que precisa do código do Brasil
    return digits.length >= 10 ? '55' + digits : digits;
  };

  const getWhatsAppUrl = (phone: string | null | undefined) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return '';
    
    // Não incluir mensagem pré-definida para evitar problemas de codificação
    return `https://wa.me/${normalizedPhone}`;
  };

  const openWhatsApp = (phone: string | null | undefined) => {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const candidates = isMobile
      ? [
          `whatsapp://send?phone=${normalized}`,
          `https://wa.me/${normalized}`,
          `https://api.whatsapp.com/send?phone=${normalized}`,
        ]
      : [
          `https://web.whatsapp.com/send?phone=${normalized}`,
          `https://wa.me/${normalized}`,
          `https://api.whatsapp.com/send?phone=${normalized}`,
        ];

    // Abre uma aba em branco e redireciona (workaround para ambientes que bloqueiam domínios externos)
    const blank = window.open('', '_blank', 'noopener,noreferrer');
    if (blank) {
      try { (blank as any).opener = null; } catch {}
      blank.location.href = candidates[0];
      return;
    }

    // Fallback direto
    const tryOpen = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
    for (const url of candidates) {
      const win = tryOpen(url);
      if (win) return;
    }

    // Último recurso: navegar nesta aba e copiar link
    try { window.top!.location.href = candidates[0]; } catch {}
    try {
      navigator.clipboard.writeText(candidates[0]);
      toast({ title: 'Link do WhatsApp copiado', description: 'Cole no navegador para abrir a conversa.' });
    } catch {}
  };
  const getEmailUrl = (email: string | null | undefined) => {
    if (!email) return '';
    const patientName = sessionPatient?.nickname || sessionPatient?.name || 'Paciente';
    const sessionDateTime = format(sessionDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const subject = encodeURIComponent(`Sobre sua sessão de ${sessionDateTime}`);
    const body = encodeURIComponent(`Olá ${patientName},\n\nEspero que esteja bem.\n\nEm relação à sua sessão agendada para ${sessionDateTime}.\n\nAtenciosamente,`);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            <Link 
              to={`/patients?pid=${session.patient_id}&open=1`}
              className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-lg transition-colors group"
              onClick={() => onOpenChange(false)}
            >
              <User className="h-5 w-5 text-primary group-hover:text-primary/80" />
              <span className="group-hover:text-foreground/80">
                {sessionPatient?.nickname || sessionPatient?.name || 'Sessão'}
              </span>
            </Link>
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(sessionDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Informações do paciente */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de Terapia</p>
                  <p className="text-sm font-medium">{getTherapyTypeDisplay(patientData?.therapy_type)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Frequência</p>
                  <p className="text-sm font-medium">{getFrequencyDisplay(patientData?.frequency)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor da Sessão</p>
                  <p className="text-sm font-medium">{formatCurrency(session.value)}</p>
                </div>
              </div>

              {isRecurring && (
                <div>
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    Sessão Recorrente
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Contato */}
          {(patientData?.whatsapp || patientData?.email) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Entrar em contato
                </p>
                <div className="flex gap-2">
                  {patientData?.whatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp(patientData.whatsapp)}
                      className="flex-1 bg-[#128C7E] hover:bg-[#128C7E] text-white border-[#128C7E] hover:border-[#128C7E] transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  {patientData?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
                    >
                      <a 
                        href={getEmailUrl(patientData.email)} 
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O que você gostaria de fazer?
            </p>
            
            <div className="space-y-2">
              {mode === 'move' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onConfirm('single')}
                    className="w-full justify-start h-auto py-3 hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Mover apenas esta sessão</div>
                      <div className="text-xs text-muted-foreground">Alterar horário desta ocorrência específica</div>
                    </div>
                  </Button>
                  
                  {isRecurring && (
                    <Button
                      variant="outline"
                      onClick={() => onConfirm('series')}
                      className="w-full justify-start h-auto py-3 hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
                    >
                      <Repeat className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Mover todas as sessões futuras</div>
                        <div className="text-xs text-muted-foreground">Alterar horário de toda a série a partir desta data</div>
                      </div>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full justify-start h-auto py-3 hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
                  >
                    <Link 
                      to={`/patients?pid=${session.patient_id}&open=1`}
                      onClick={() => onOpenChange(false)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Ver dados detalhados</div>
                        <div className="text-xs text-muted-foreground">Abrir ficha completa do paciente</div>
                      </div>
                    </Link>
                  </Button>

                  {isRecurring && (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full justify-start h-auto py-3 hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
                    >
                      <Link 
                        to={`/patients?pid=${session.patient_id}&open=1&section=recurrence`}
                        onClick={() => onOpenChange(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Ajustar recorrência</div>
                          <div className="text-xs text-muted-foreground">Modificar agendamento recorrente</div>
                        </div>
                      </Link>
                    </Button>
                  )}
                </>
              )}

              {onDelete && (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="w-full justify-start h-auto py-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Excluir esta sessão</div>
                    <div className="text-xs text-muted-foreground">Remover permanentemente esta sessão</div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full hover:bg-[#DDC0E4] hover:text-foreground transition-colors"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};