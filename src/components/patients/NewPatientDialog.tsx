
import { useState, useEffect } from "react";
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
  Cake
} from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useRecurringSchedules } from "@/hooks/useRecurringSchedules";
import { RecurrenceRule } from "@/types/frequency";
import { SchedulingSection } from "./SchedulingSection";
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
import { useSessionsCache } from "@/contexts/SessionsCacheContext";

const patientSchema = z.object({
  // Dados Básicos (obrigatórios)
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
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
  
  // Dados Adicionais (opcionais)
  nickname: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

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
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>();
  const { createPatient, updatePatient, archivePatient, isCreating, isUpdating, isArchiving } = usePatients();
  const { createSchedule, updateSchedule, schedules } = useRecurringSchedules();
  const { clearCache } = useSessionsCache();

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
    },
  });

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
        session_value: patient.session_value?.toString() || "80",
      });

      // Carregar agenda existente
      if (schedules.length > 0) {
        const existingSchedule = schedules.find(s => s.patient_id === patient.id && s.is_active);
        if (existingSchedule) {
          setRecurrenceRule(existingSchedule.rrule_json);
        }
      }
    }
  }, [isEdit, patient, schedules, form, open]);

  // Limpar estados quando dialog fecha
  useEffect(() => {
    if (!open) {
      setRecurrenceRule(undefined);
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: PatientFormData) => {
    if (isEdit && patient) {
      // Modo edição
      const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
      
      const updates = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        session_mode: data.session_mode,
        session_value: sessionValue,
        email: data.email || undefined,
        phone: data.phone || undefined,
        nickname: data.nickname || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
      };

      updatePatient({ id: patient.id, updates }, {
        onSuccess: () => {
          // Atualizar agenda se há regra de recorrência
          if (recurrenceRule) {
            const existingSchedule = schedules.find(s => s.patient_id === patient.id && s.is_active);
            const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
            
            if (existingSchedule) {
              // Atualizar agenda existente
              updateSchedule({
                id: existingSchedule.id,
                updates: {
                  rrule_json: recurrenceRule,
                  session_type: data.therapy_type,
                  session_value: sessionValue,
                }
              });
            } else {
              // Criar nova agenda
              createSchedule({
                patient_id: patient.id,
                rrule_json: recurrenceRule,
                duration_minutes: 50,
                session_type: data.therapy_type,
                session_value: sessionValue,
              });
            }
            
            // Limpar cache de sessões para forçar atualização imediata
            clearCache();
          }
          
          form.reset();
          setOpen(false);
        },
      });
    } else {
      // Modo criação
      const frequency = recurrenceRule?.frequency || 'custom';
      
      const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
      
      const patientData: CreatePatientData = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        frequency: frequency,
        session_mode: data.session_mode,
        session_value: sessionValue,
        email: data.email || undefined,
        phone: data.phone || undefined,
        nickname: data.nickname || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        frequency_preset_id: recurrenceRule?.presetId || undefined,
      };

      createPatient(patientData, {
        onSuccess: (newPatient: any) => {
          // Se há regra de recorrência, criar o agendamento recorrente
          if (recurrenceRule && newPatient) {
            const sessionValue = data.session_value ? parseFloat(data.session_value) : 80;
            
            createSchedule({
              patient_id: newPatient.id,
              rrule_json: recurrenceRule,
              duration_minutes: 50,
              session_type: data.therapy_type,
              session_value: sessionValue,
            });
          }
          
          form.reset();
          setRecurrenceRule(undefined);
          setOpen(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="bg-gradient-to-br from-background via-background to-muted/10 p-6">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold">
                  {isEdit ? 'Ficha do Paciente' : 'Nova Ficha de Paciente'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEdit ? 'Atualizar informações do paciente' : 'Cadastrar novo paciente no sistema'}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 max-h-[calc(90vh-140px)] overflow-y-auto">
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

                  <FormField
                    control={form.control}
                    name="session_value"
                    render={({ field }) => (
                      <FormItem className="max-w-xs mb-6">
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

                  {/* Agendamento */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium">Agendamento</h4>
                    </div>
                    
                    <SchedulingSection
                      value={recurrenceRule}
                      onChange={setRecurrenceRule}
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
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-emerald-500" />
                          <h3 className="text-lg font-semibold text-foreground">Informações Complementares</h3>
                          <Badge variant="outline" className="ml-2">Opcional</Badge>
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

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-3 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="min-w-[100px]"
                >
                  Cancelar
                </Button>
                {isEdit && patient && !patient.is_archived && (
                  <Button 
                    type="button" 
                    variant="archive" 
                    onClick={() => {
                      archivePatient(patient.id);
                      setOpen(false);
                    }}
                    disabled={isArchiving}
                    className="min-w-[100px]"
                  >
                    {isArchiving ? "Arquivando..." : "Arquivar"}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-gradient-primary hover:opacity-90 min-w-[140px]"
                >
                  {isCreating || isUpdating 
                    ? "Salvando..." 
                    : isEdit 
                      ? "Salvar Alterações" 
                      : "Salvar Paciente"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
