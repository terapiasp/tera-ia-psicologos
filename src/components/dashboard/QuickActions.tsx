import { Calendar, FileText, Phone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className={`h-16 flex-col gap-2 ${action.className || ""}`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}