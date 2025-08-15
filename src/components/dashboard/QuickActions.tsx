import { Calendar, FileText, Phone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { NewSessionDialog } from "@/components/sessions/NewSessionDialog";

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: "Nova Sessão",
      variant: "default" as const,
      className: "bg-gradient-primary hover:opacity-90",
    },
    {
      icon: Users,
      label: "Novo Paciente",
      variant: "outline" as const,
    },
    {
      icon: FileText,
      label: "Relatório",
      variant: "outline" as const,
    },
    {
      icon: Phone,
      label: "Contato",
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <NewSessionDialog>
            <Button
              variant="default"
              className="h-16 flex-col gap-2 bg-gradient-primary hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Nova Sessão</span>
            </Button>
          </NewSessionDialog>

          <NewPatientDialog>
            <Button
              variant="outline"
              className="h-16 flex-col gap-2"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Novo Paciente</span>
            </Button>
          </NewPatientDialog>

          <Button
            variant="outline"
            className="h-16 flex-col gap-2"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Relatório</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col gap-2"
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs font-medium">Contato</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}