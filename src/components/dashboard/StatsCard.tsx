import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

export function StatsCard({ title, value, description, icon: Icon, trend, onClick }: StatsCardProps) {
  return (
    <Card 
      className={`shadow-soft hover:shadow-medium transition-all duration-200 border-0 bg-gradient-soft ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${
                  trend.value > 0 
                    ? 'text-success' 
                    : trend.value < 0 
                    ? 'text-destructive' 
                    : 'text-muted-foreground'
                }`}>
                  {trend.value > 0 && '+'}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}