
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Phone, 
  MessageCircle,
  Brain,
  Monitor,
  DollarSign,
  Calendar,
  FileText,
  Mail,
  MapPin,
  Cake,
  Video,
  X,
  Save,
  Archive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useRecurringSchedules } from "@/hooks/useRecurringSchedules";
import { RecurrenceRule, SchedulingData } from "@/types/frequency";
import { SchedulingSection } from "./SchedulingSection";
import SessionLinkInput from "./SessionLinkInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneInputField } from "./PhoneInputField";
import { SessionValueInput } from "./SessionValueInput";
import { usePatients, CreatePatientData } from "@/hooks/usePatients";
import { useSessions } from "@/hooks/useSessions";
import { useSessionsCache } from "@/contexts/SessionsCacheContext";

// Create schema function to have access to context
const createPatientSchema = (existingNames: string[], currentPatientId?: string) => z.object({
  // Dados Básicos (obrigatórios)
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .refine((name) => {
      const normalizedName = name.trim().toLowerCase();
      const isDuplicate = existingNames.some(existingName => 
        existingName.toLowerCase() === normalizedName
      );
      return !isDuplicate;
    }, "Já existe um paciente com este nome"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .refine((value) => {
      try {
        return isValidPhoneNumber(value);
      } catch {
        return false;
      }
    }, "Número de WhatsApp inválido"),
  
  // Dados Técnicos
  therapy_type: z.string().min(1, "Selecione o tipo de terapia"),
  session_mode: z.string().min(1, "Selecione o modo da sessão"),
  session_value: z.string().optional(),
  session_duration: z.string().optional(),
  
  // Dados Adicionais (opcionais)
  nickname: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  
  // Campos de link de sessão
  recurring_meet_code: z.string().optional(),
  external_session_link: z.string().optional(),
  link_type: z.enum(['recurring_meet', 'external']).optional(),
});

type PatientFormData = z.infer<ReturnType<typeof createPatientSchema>>;

interface NewPatientDialogProps {
  children: React.ReactNode;
  patient?: any; // Patient to edit, if provided
  isEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewPatientDialog({ children, patient, isEdit = false, open: controlledOpen, onOpenChange: controlledOnOpenChange }: NewPatientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showAdditionalData, setShowAdditionalData] = useState(false);
  const linkSectionRef = useRef<HTMLDivElement>(null);
  const sessionLinkInputRef = useRef<HTMLInputElement>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [schedulingData, setSchedulingData] = useState<SchedulingData | undefined>();
  const [originalSchedulingData, setOriginalSchedulingData] = useState<SchedulingData | undefined>();
  const { patients, createPatient, updatePatient, archivePatient, isCreating, isUpdating, isArchiving } = usePatients();
  const { createSchedule, updateSchedule, schedules } = useRecurringSchedules();
  const { clearCache } = useSessionsCache();
  const { createSession } = useSessions();

  // Get existing patient names for validation, excluding current patient if editing
  const existingNames = patients
    .filter(p => isEdit ? p.id !== patient?.id : true)
    .map(p => p.name);
  
  const patientSchema = createPatientSchema(existingNames, patient?.id);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name || "",
      nickname: patient?.nickname || "",
      email: patient?.email || "",
      phone: patient?.phone || "",
      whatsapp: patient?.whatsapp || "",
      birth_date: patient?.birth_date || "",
      therapy_type: patient?.therapy_type || "",
      session_mode: patient?.session_mode || "online",
      address: patient?.address || "",
      session_value: patient?.session_value?.toString() || "80",
      session_duration: patient?.session_duration?.toString() || "50",
    },
  });

  // Monitor form changes
  const watchedValues = form.watch();
  useEffect(() => {
    if (open) {
      const isDirty = form.formState.isDirty;
      setHasUnsavedChanges(isDirty);
    }
  }, [watchedValues, form.formState.isDirty, open]);

  // Carregar dados quando o dialog abre para edição
  useEffect(() => {
    if (isEdit && patient) {
      // Resetar form com valores do paciente
      form.reset({
        name: patient.name || "",
        nickname: patient.nickname || "",
        email: patient.email || "",
        phone: patient.phone || "",
        whatsapp: patient.whatsapp || "",
        birth_date: patient.birth_date || "",
        therapy_type: patient.therapy_type || "",
        session_mode: patient.session_mode || "online",
        address: patient.address || "",
        recurring_meet_code: patient.recurring_meet_code || "",
        external_session_link: patient.external_session_link || "",
        link_type: patient.link_type || undefined,
        session_value: patient.session_value?.toString() || "80",
        session_duration: patient.session_duration?.toString() || "50",
      });

      // Carregar agenda existente
      if (schedules.length > 0) {
        const existingSchedule = schedules.find(s => s.patient_id === patient.id && s.is_active);
        if (existingSchedule) {
          const schedulingDataValue = {
            type: 'recurring' as const,
            recurrenceRule: existingSchedule.rrule_json
          };
          setSchedulingData(schedulingDataValue);
          setOriginalSchedulingData(schedulingDataValue);
        }
      }
    }
  }, [isEdit, patient, schedules, form, open]);

  // Scroll automático para seção do link quando especificado
  useEffect(() => {
    if (open && isEdit) {
      const scrollToSection = window.sessionStorage.getItem('scrollToSection');
      if (scrollToSection === 'link') {
        // Aguardar um tempo para o dialog estar completamente renderizado
        setTimeout(() => {
          // Abrir a seção de dados adicionais se ainda não estiver aberta
          setShowAdditionalData(true);
          
          // Scroll para a seção do link
          setTimeout(() => {
            if (linkSectionRef.current) {
              linkSectionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
            
            // Focar no input após scroll
            setTimeout(() => {
              // O input está dentro do SessionLinkInput, então vamos simular um clique
              const linkInputs = document.querySelectorAll('input[placeholder*="meet.google.com"], input[placeholder*="https://"]');
              if (linkInputs.length > 0) {
                (linkInputs[0] as HTMLInputElement).focus();
              }
            }, 500);
          }, 300);
        }, 500);
        
        // Limpar após usar
        window.sessionStorage.removeItem('scrollToSection');
      }
    }
  }, [open, isEdit]);
  useEffect(() => {
    if (!open) {
      setSchedulingData(undefined);
      setOriginalSchedulingData(undefined);
      setHasUnsavedChanges(false);
      form.reset();
    }
  }, [open, form]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setOpen(false);
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    setOpen(false);
  };

  const handleSave = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleArchive = () => {
    setShowArchiveDialog(true);
  };

  const handleConfirmArchive = () => {
    if (patient) {
      archivePatient(patient.id);
      setShowArchiveDialog(false);
      setOpen(false);
    }
  };

  // Function to format URL with https://
  const formatUrl = (url: string) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const onSubmit = (data: PatientFormData) => {
    if (isEdit && patient) {
      // Modo edição
      const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
      
      const durationMinutes = data.session_duration ? parseInt(data.session_duration) : 50;
      
      // Process session link data
      const linkData: any = {};
      if (data.link_type === 'recurring_meet' && data.recurring_meet_code) {
        linkData.recurring_meet_code = data.recurring_meet_code;
        linkData.link_type = 'recurring_meet';
        linkData.link_created_at = new Date().toISOString();
        linkData.external_session_link = null;
      } else if (data.link_type === 'external' && data.external_session_link) {
        linkData.external_session_link = formatUrl(data.external_session_link);
        linkData.link_type = 'external';
        linkData.link_created_at = new Date().toISOString();
        linkData.recurring_meet_code = null;
      } else {
        linkData.link_type = null;
        linkData.recurring_meet_code = null;
        linkData.external_session_link = null;
        linkData.link_created_at = null;
      }

      const updates = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        session_mode: data.session_mode,
        session_value: sessionValue,
        session_duration: durationMinutes,
        email: data.email || undefined,
        phone: data.phone || undefined,
        nickname: data.nickname || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        ...linkData,
      };

      updatePatient({ id: patient.id, updates }, {
        onSuccess: () => {
          // Verificar se realmente houve mudança na agenda antes de atualizar
          const hasSchedulingChanges = schedulingData && JSON.stringify(schedulingData) !== JSON.stringify(originalSchedulingData);
          
          console.log('Update patient - hasSchedulingChanges:', hasSchedulingChanges);
          console.log('schedulingData:', schedulingData);
          console.log('originalSchedulingData:', originalSchedulingData);
          
          if (hasSchedulingChanges && schedulingData) {
            const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
            
            if (schedulingData.type === 'recurring' && schedulingData.recurrenceRule) {
              const existingSchedule = schedules.find(s => s.patient_id === patient.id && s.is_active);
              
              if (existingSchedule) {
                // Atualizar agenda existente APENAS se realmente mudou
                console.log('Updating existing schedule because it changed');
                updateSchedule({
                  id: existingSchedule.id,
                  updates: {
                    rrule_json: schedulingData.recurrenceRule,
                    session_type: data.therapy_type,
                    session_value: sessionValue,
                    duration_minutes: durationMinutes,
                  }
                });
              } else {
                // Criar nova agenda
                console.log('Creating new schedule');
                createSchedule({
                  patient_id: patient.id,
                  rrule_json: schedulingData.recurrenceRule,
                  duration_minutes: durationMinutes,
                  session_type: data.therapy_type,
                  session_value: sessionValue,
                });
              }
            } else if (schedulingData.type === 'single' && schedulingData.singleSession) {
              // Criar sessão única
              const scheduledAt = new Date(`${schedulingData.singleSession.date}T${schedulingData.singleSession.time}:00`);
              
              createSession({
                patient_id: patient.id,
                scheduled_at: scheduledAt.toISOString(),
                duration_minutes: durationMinutes,
                modality: 'individual',
                value: sessionValue,
                notes: '',
              });
            }
            
            // Limpar cache de sessões para forçar atualização imediata
            clearCache();
          } else {
            console.log('No scheduling changes detected, skipping schedule update');
          }
          
          form.reset();
          setHasUnsavedChanges(false);
          setOpen(false);
          toast({
            title: "Ficha de Paciente atualizada com sucesso",
            description: "As informações foram salvas.",
          });
        },
      });
    } else {
      // Modo criação
      const frequency = schedulingData?.recurrenceRule?.frequency === 'custom' ? 'others' : (schedulingData?.recurrenceRule?.frequency || 'weekly');
      
      const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
      const durationMinutes = data.session_duration ? parseInt(data.session_duration) : 50;
      
      // Process session link data for creation
      const linkData: any = {};
      if (data.link_type === 'recurring_meet' && data.recurring_meet_code) {
        linkData.recurring_meet_code = data.recurring_meet_code;
        linkData.link_type = 'recurring_meet';
        linkData.link_created_at = new Date().toISOString();
      } else if (data.link_type === 'external' && data.external_session_link) {
        linkData.external_session_link = formatUrl(data.external_session_link);
        linkData.link_type = 'external';
        linkData.link_created_at = new Date().toISOString();
      }
      
      const patientData: CreatePatientData = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        frequency: frequency,
        session_mode: data.session_mode,
        session_value: sessionValue,
        session_duration: durationMinutes,
        email: data.email || undefined,
        phone: data.phone || undefined,
        nickname: data.nickname || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        frequency_preset_id: schedulingData?.recurrenceRule?.presetId || undefined,
        ...linkData,
      };

      createPatient(patientData, {
        onSuccess: (newPatient: any) => {
          // Criar agendamento baseado no tipo
          if (schedulingData && newPatient) {
            const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
            
            if (schedulingData.type === 'recurring' && schedulingData.recurrenceRule) {
              // Criar agenda recorrente
              createSchedule({
                patient_id: newPatient.id,
                rrule_json: schedulingData.recurrenceRule,
                duration_minutes: durationMinutes,
                session_type: data.therapy_type,
                session_value: sessionValue,
              });
            } else if (schedulingData.type === 'single' && schedulingData.singleSession) {
              // Criar sessão única
              const scheduledAt = new Date(`${schedulingData.singleSession.date}T${schedulingData.singleSession.time}:00`);
              
              createSession({
                patient_id: newPatient.id,
                scheduled_at: scheduledAt.toISOString(),
                duration_minutes: durationMinutes,
                modality: 'individual',
                value: sessionValue,
                notes: '',
              });
            }
          }
          
          form.reset();
          setSchedulingData(undefined);
          setHasUnsavedChanges(false);
          setOpen(false);
          toast({
            title: "Paciente criado",
            description: "O novo paciente foi cadastrado com sucesso.",
          });
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        } else {
          setOpen(newOpen);
        }
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" onInteractOutside={(e) => e.preventDefault()}>
          {/* Fixed Header with Action Buttons */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base sm:text-lg font-semibold leading-tight">
                    {isEdit ? 'Ficha do Paciente' : 'Nova Ficha de Paciente'}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground leading-tight truncate">
                    {isEdit ? 'Atualizar informações do paciente' : 'Cadastrar novo paciente no sistema'}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEdit && patient && !patient.is_archived && (
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isArchiving ? "Arquivando..." : "Arquivar"}
                  </Button>
                )}
                
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isCreating || isUpdating}
                  size="sm"
                  className="bg-gradient-primary hover:opacity-90 gap-1.5 text-xs sm:text-sm"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isCreating || isUpdating 
                    ? "Salvando..." 
                    : isEdit 
                      ? "Salvar" 
                      : "Salvar"
                  }
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive ml-1"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 pb-6 max-h-[calc(90vh-80px)] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Dados Básicos */}
              <Card className="border-l-4 border-l-primary shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Dados Básicos</h3>
                    <Badge variant="secondary" className="ml-auto">Obrigatório</Badge>
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" />
                            Nome *
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Como o paciente prefere ser chamado (usado em lembretes automáticos)
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Ex: João, Maria, Dr. Silva..." 
                              {...field} 
                              className="h-12 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp *
                          </FormLabel>
                          <div className="text-sm text-muted-foreground mb-2">
                            Incluindo código do país (ex: +55 11 99999-9999 para Brasil)
                          </div>
                          <FormControl>
                            <div className="relative">
                              <PhoneInputField
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Selecione o país e digite o número"
                                className="h-12 text-base"
                                disabled={form.formState.isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dados Técnicos */}
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-foreground">Configuração Terapêutica</h3>
                    <Badge variant="outline" className="ml-auto">Técnico</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormField
                      control={form.control}
                      name="therapy_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <Brain className="h-4 w-4" />
                            Tipo de Terapia *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="individual_adult">👤 Individual Adulto</SelectItem>
                              <SelectItem value="individual_child">🧒 Individual Infantil</SelectItem>
                              <SelectItem value="individual_teen">👦 Individual Adolescente</SelectItem>
                              <SelectItem value="couple">💑 Terapia de Casal</SelectItem>
                              <SelectItem value="family">👨‍👩‍👧‍👦 Terapia Familiar</SelectItem>
                              <SelectItem value="group">👥 Terapia em Grupo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="session_mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <Monitor className="h-4 w-4" />
                            Modalidade *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Selecione a modalidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online">🖥️ Online</SelectItem>
                              <SelectItem value="in_person">🏢 Presencial</SelectItem>
                              <SelectItem value="hybrid">🔄 Híbrido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(form.watch("session_mode") === "online" || form.watch("session_mode") === "hybrid") && (
                    <div className="mb-6" ref={linkSectionRef}>
                      <FormField
                        control={form.control}
                        name="recurring_meet_code"
                        render={({ field: meetCodeField }) => (
                          <FormField
                            control={form.control}
                            name="external_session_link"
                            render={({ field: externalLinkField }) => (
                              <FormField
                                control={form.control}
                                name="link_type"
                                render={({ field: linkTypeField }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-base">
                                      <Video className="h-4 w-4" />
                                      Link de Sessão
                                    </FormLabel>
                                    <FormControl>
                                      <SessionLinkInput
                                        recurringMeetCode={meetCodeField.value || ""}
                                        externalSessionLink={externalLinkField.value || ""}
                                        linkType={linkTypeField.value}
                                        onRecurringMeetCodeChange={meetCodeField.onChange}
                                        onExternalLinkChange={externalLinkField.onChange}
                                        onLinkTypeChange={linkTypeField.onChange}
                                        className="w-full"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          />
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormField
                      control={form.control}
                      name="session_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4" />
                            Valor da Sessão
                          </FormLabel>
                          <FormControl>
                            <SessionValueInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={form.formState.isSubmitting}
                              placeholder="80"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="session_duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base">
                            <Calendar className="h-4 w-4" />
                            Duração da Sessão
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "50"}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Duração" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="50">50 minutos (padrão)</SelectItem>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="100">100 minutos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Agendamento */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium">Agendamento</h4>
                    </div>
                    
                    <SchedulingSection
                      value={schedulingData}
                      onChange={setSchedulingData}
                      sessionValue={form.watch("session_value") ? parseFloat(form.watch("session_value")) : 80}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dados Adicionais (Colapsível) */}
              <Collapsible open={showAdditionalData} onOpenChange={setShowAdditionalData}>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardContent className="p-6">
                    <CollapsibleTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full justify-between p-0 h-auto hover:bg-transparent"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Informações Complementares</h3>
                          <Badge variant="outline" className="ml-1 sm:ml-2 text-xs flex-shrink-0">Opcional</Badge>
                        </div>
                        {showAdditionalData ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-6 pt-6 animate-accordion-down">
                      <FormField
                        control={form.control}
                        name="nickname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base">
                              <User className="h-4 w-4" />
                              Nome Completo
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome completo para documentos oficiais" 
                                {...field} 
                                className="h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                <Mail className="h-4 w-4" />
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="email@exemplo.com" 
                                  {...field} 
                                  className="h-12 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                <Phone className="h-4 w-4" />
                                Telefone Adicional
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(11) 3333-4444" 
                                  {...field} 
                                  className="h-12 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="birth_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                <Cake className="h-4 w-4" />
                                Data de Nascimento
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  className="h-12 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" />
                                Endereço
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Rua, número, bairro" 
                                  {...field} 
                                  className="h-12 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>

              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você fez alterações que ainda não foram salvas. Deseja salvar antes de fechar ou descartar as alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmClose}>
              Descartar alterações
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
              Salvar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar arquivamento</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Tem certeza que deseja arquivar este paciente? As seguintes ações serão realizadas:</p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span>O paciente será movido para a lista de arquivados</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span>O link de sessão associado ao paciente será removido</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span>As sessões agendadas deste paciente serão removidas da agenda</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-orange-600 hover:bg-orange-700">
              Arquivar paciente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
