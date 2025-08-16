import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WeekDay {
  date: string;
  day: string;
  sessions: number;
  isToday?: boolean;
}

const weekData: WeekDay[] = [
  { date: "15", day: "SEG", sessions: 4, isToday: true },
  { date: "16", day: "TER", sessions: 6 },
  { date: "17", day: "QUA", sessions: 3 },
  { date: "18", day: "QUI", sessions: 5 },
  { date: "19", day: "SEX", sessions: 4 },
  { date: "20", day: "SÁB", sessions: 2 },
  { date: "21", day: "DOM", sessions: 0 },
];

export function WeeklyView() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Visão Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day) => (
            <div
              key={day.date}
              className={`text-center p-3 rounded-lg transition-colors ${
                day.isToday
                  ? "bg-gradient-primary text-white"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="text-xs font-medium opacity-75 mb-1">
                {day.day}
              </div>
              <div className={`text-lg font-bold mb-2 ${
                day.isToday ? "text-white" : "text-foreground"
              }`}>
                {day.date}
              </div>
              <Badge 
                variant={day.isToday ? "secondary" : "outline"} 
                className={`text-xs ${
                  day.isToday 
                    ? "bg-white/20 text-white border-white/30" 
                    : day.sessions === 0 
                    ? "opacity-50" 
                    : ""
                }`}
              >
                {day.sessions === 0 ? "Livre" : `${day.sessions} sessões`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}