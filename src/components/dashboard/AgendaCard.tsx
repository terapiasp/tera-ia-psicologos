import { Calendar, Clock, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Session {
  id: string;
  patient: string;
  time: string;
  type: string;
  status: "confirmed" | "pending" | "completed";
  location?: string;
}

interface AgendaCardProps {
  title: string;
  date: string;
  sessions: Session[];
}

export function AgendaCard({ title, date, sessions }: AgendaCardProps) {
  const getStatusColor = (status: Session["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-success text-success-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      case "completed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusText = (status: Session["status"]) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {date}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma sessão agendada</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-gradient-soft rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {session.time}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">{session.patient}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{session.type}</span>
                    {session.location && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(session.status)}>
                  {getStatusText(session.status)}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}