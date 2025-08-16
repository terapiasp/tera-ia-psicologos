
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useSessions, CreateSessionData } from "@/hooks/useSessions";
import { usePatients } from "@/hooks/usePatients";

const sessionSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  duration_minutes: z.number().min(15, "Duração mínima de 15 minutos").default(50),
  modality: z.string().min(1, "Selecione a modalidade"), // Mudou de type para modality
  value: z.number().min(0, "Valor deve ser positivo").optional(),
  notes: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface NewSessionDialogProps {
  children: React.ReactNode;
}

export function NewSessionDialog({ children }: NewSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const { createSession, isCreating } = useSessions();
  const { patients } = usePatients();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      patient_id: "",
      date: "",
      time: "",
      duration_minutes: 50,
      modality: "individual", // Mudou de type para modality
      value: undefined,
      notes: "",
    },
  });

  const onSubmit = (data: SessionFormData) => {
    // Combinar data e hora em um timestamp ISO
    const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString();

    const sessionData: CreateSessionData = {
      patient_id: data.patient_id,
      scheduled_at: scheduledAt,
      duration_minutes: data.duration_minutes,
      modality: data.modality, // Agora é modalidade
      value: data.value,
      notes: data.notes || undefined,
    };

    createSession(sessionData, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  const activePatients = patients.filter(p => p.status === 'active');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nova Sessão
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                          {patient.nickname && ` (${patient.nickname})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a modalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="couple">Casal</SelectItem>
                        <SelectItem value="family">Família</SelectItem>
                        <SelectItem value="group">Grupo</SelectItem>
                        <SelectItem value="evaluation">Avaliação</SelectItem>
                        <SelectItem value="return">Retorno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a sessão..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                {isCreating ? "Agendando..." : "Agendar Sessão"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
