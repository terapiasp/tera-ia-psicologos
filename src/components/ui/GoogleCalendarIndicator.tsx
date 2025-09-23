import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

interface GoogleCalendarIndicatorProps {
  className?: string;
}

export const GoogleCalendarIndicator = ({ className }: GoogleCalendarIndicatorProps) => {
  const { isConnected } = useGoogleCalendar();

  if (!isConnected) return null;

  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      <Calendar className="h-3 w-3 mr-1" />
      Sincronizado
    </Badge>
  );
};