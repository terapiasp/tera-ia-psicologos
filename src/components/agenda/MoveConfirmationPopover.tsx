import React, { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Session } from '@/hooks/useSessions';
import { Patient } from '@/hooks/usePatients';
import { usePatients } from '@/hooks/usePatients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, DollarSign, Repeat, Trash2, MapPin, Eye, Settings, Phone, Mail, Video, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  // All hooks must be called before any early returns
  const [sessionLink, setSessionLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updatePatient } = usePatients();
  const { toast } = useToast();
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar o estado com os dados do paciente quando o modal abrir
  React.useEffect(() => {
    if (open && patientData) {
      // Priorizar novos campos de link
      let resolvedLink = '';
      
      if (patientData.link_type === 'recurring_meet' && patientData.recurring_meet_code) {
        resolvedLink = `https://meet.google.com/${patientData.recurring_meet_code}`;
      } else if (patientData.link_type === 'external' && patientData.external_session_link) {
        resolvedLink = patientData.external_session_link;
      } else if (patientData.session_link) {
        // Fallback para campo legacy
        resolvedLink = patientData.session_link;
      }
      
      setSessionLink(resolvedLink);
    } else if (open) {
      setSessionLink('');
    }
  }, [open, patientData?.link_type, patientData?.recurring_meet_code, patientData?.external_session_link, patientData?.session_link]);

  // Early return after all hooks have been called
  if (!session) return null;

  const isRecurring = !!session.schedule_id;
  const sessionDate = new Date(session.scheduled_at);
  const sessionPatient = session.patients;


  const formatUrl = (url: string) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const handleSaveSessionLink = async () => {
    if (!patientData) return;
    
    setIsSaving(true);
    try {
      const formattedUrl = formatUrl(sessionLink);
      
      // Detectar tipo de link e salvar nos campos corretos
      let updates: any = {};
      
      if (formattedUrl.includes('meet.google.com/')) {
        // Extract meet code from URL
        const meetCode = formattedUrl.replace(/^https?:\/\/meet\.google\.com\//, '');
        updates = {
          link_type: 'recurring_meet',
          recurring_meet_code: meetCode,
          external_session_link: null,
          link_created_at: new Date().toISOString(),
          link_last_used: null
        };
      } else if (formattedUrl) {
        // External link
        updates = {
          link_type: 'external',
          external_session_link: formattedUrl,
          recurring_meet_code: null,
          link_created_at: new Date().toISOString()
        };
      } else {
        // Clear all link data
        updates = {
          link_type: null,
          recurring_meet_code: null,
          external_session_link: null,
          link_created_at: null,
          link_last_used: null
        };
      }
      
      await updatePatient({
        id: patientData.id,
        updates
      });
      
      toast({
        title: "Link salvo com sucesso",
        description: "O link da sessão foi atualizado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o link da sessão.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    const patientName = sessionPatient?.nickname || sessionPatient?.name || 'Paciente';
    const sessionDateTime = format(sessionDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const message = encodeURIComponent(`Olá ${patientName}! Sobre sua sessão de ${sessionDateTime}.`);
    return `https://wa.me/${normalizedPhone}?text=${message}`;
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

          {/* Informações de Contato */}
          {(patientData?.whatsapp || patientData?.email) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contato
                </p>
                <div className="space-y-2">
                  {patientData?.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patientData.whatsapp}</span>
                    </div>
                  )}
                  {patientData?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{patientData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}


          {/* Link da Sessão */}
          {(patientData?.session_mode === 'online' || patientData?.session_mode === 'hybrid') && (() => {
            // Obter o link resolvido do paciente
            let resolvedLink = '';
            
            if (patientData?.link_type === 'recurring_meet' && patientData.recurring_meet_code) {
              resolvedLink = `https://meet.google.com/${patientData.recurring_meet_code}`;
            } else if (patientData?.link_type === 'external' && patientData.external_session_link) {
              resolvedLink = patientData.external_session_link;
            } else if (patientData?.session_link) {
              resolvedLink = patientData.session_link;
            }

            if (resolvedLink) {
              return (
                <>
                  <Separator />
                  <Button
                    onClick={() => window.open(resolvedLink, '_blank', 'noopener,noreferrer')}
                    className="w-full bg-gradient-to-r from-[hsl(350,85%,60%)] to-[hsl(25,95%,65%)] hover:from-[hsl(350,85%,55%)] hover:to-[hsl(25,95%,60%)] text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Acessar Sessão
                  </Button>
                </>
              );
            }
            return null;
          })()}

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