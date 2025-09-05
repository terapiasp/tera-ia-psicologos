
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useRecurringSchedules } from "@/hooks/useRecurringSchedules";
import { RecurrenceRule } from "@/types/frequency";
import { RecurrenceBuilder } from "./RecurrenceBuilder";
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
import { usePatients, CreatePatientData } from "@/hooks/usePatients";
import { useSessionsCache } from "@/contexts/SessionsCacheContext";

const patientSchema = z.object({
  // Dados Básicos (obrigatórios)
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  
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

  // Carregar agenda existente do paciente quando for edição
  useEffect(() => {
    if (isEdit && patient && schedules.length > 0) {
      const existingSchedule = schedules.find(s => s.patient_id === patient.id && s.is_active);
      if (existingSchedule) {
        setRecurrenceRule(existingSchedule.rrule_json);
      }
    }
  }, [isEdit, patient, schedules]);

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
      session_value: "80",
    },
  });

  const onSubmit = (data: PatientFormData) => {
    if (isEdit && patient) {
      // Modo edição
      const updates = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        session_mode: data.session_mode,
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
      
      const patientData: CreatePatientData = {
        name: data.name,
        whatsapp: data.whatsapp,
        therapy_type: data.therapy_type,
        frequency: frequency,
        session_mode: data.session_mode,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isEdit ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Dados Básicos</h3>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome *
                      <span className="text-xs text-muted-foreground block font-normal">
                        Como o paciente prefere ser chamado (usado em lembretes automáticos)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome preferido do paciente" {...field} />
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
                    <FormLabel>WhatsApp *</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dados Técnicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Dados Técnicos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="therapy_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Terapia *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual_adult">Individual Adulto</SelectItem>
                          <SelectItem value="individual_child">Individual Infantil</SelectItem>
                          <SelectItem value="individual_teen">Individual Adolescente</SelectItem>
                          <SelectItem value="couple">Terapia de Casal</SelectItem>
                          <SelectItem value="family">Terapia Familiar</SelectItem>
                          <SelectItem value="group">Terapia em Grupo</SelectItem>
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
                      <FormLabel>Modo da Sessão *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="in_person">Presencial</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
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
                  <FormItem className="max-w-xs">
                    <FormLabel>Valor da Sessão (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="80.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agendamento Recorrente */}
              <RecurrenceBuilder
                value={recurrenceRule}
                onChange={setRecurrenceRule}
                sessionType={form.watch("therapy_type")}
                sessionValue={form.watch("session_value") ? parseFloat(form.watch("session_value")) : 80}
              />
            </div>

            {/* Dados Adicionais (Colapsível) */}
            <Collapsible open={showAdditionalData} onOpenChange={setShowAdditionalData}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-border w-full">
                    <h3 className="text-lg font-medium text-foreground">Dados Adicionais</h3>
                    <span className="text-sm text-muted-foreground">(opcional)</span>
                  </div>
                  {showAdditionalData ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo para documentos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              {isEdit && patient && !patient.is_archived && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    archivePatient(patient.id);
                    setOpen(false);
                  }}
                  disabled={isArchiving}
                >
                  {isArchiving ? "Arquivando..." : "Arquivar"}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="bg-gradient-primary hover:opacity-90"
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
      </DialogContent>
    </Dialog>
  );
}
