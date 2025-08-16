
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useRecurringSchedules, RecurrenceRule } from "@/hooks/useRecurringSchedules";
import { RecurrenceBuilder } from "./RecurrenceBuilder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const patientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  nickname: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  birth_date: z.string().optional(),
  therapy_type: z.string().min(1, "Selecione o tipo de terapia"),
  session_mode: z.string().min(1, "Selecione o modo da sessão"),
  address: z.string().optional(),
  session_value: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface NewPatientDialogProps {
  children: React.ReactNode;
}

export function NewPatientDialog({ children }: NewPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>();
  const { createPatient, isCreating } = usePatients();
  const { createSchedule } = useRecurringSchedules();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      nickname: "",
      email: "",
      phone: "",
      whatsapp: "",
      birth_date: "",
      therapy_type: "",
      session_mode: "online",
      address: "",
      session_value: "80",
    },
  });

  const onSubmit = (data: PatientFormData) => {
    // A frequência agora vem do agendamento recorrente
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
            Novo Paciente
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apelido</FormLabel>
                    <FormControl>
                      <Input placeholder="Como prefere ser chamado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
            </div>

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

            <FormField
              control={form.control}
              name="session_value"
              render={({ field }) => (
                <FormItem>
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

            {/* Agendamento Recorrente Integrado */}
            <RecurrenceBuilder
              value={recurrenceRule}
              onChange={setRecurrenceRule}
              sessionType={form.watch("therapy_type")}
              sessionValue={form.watch("session_value") ? parseFloat(form.watch("session_value")) : 80}
            />

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isCreating ? "Salvando..." : "Salvar Paciente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
