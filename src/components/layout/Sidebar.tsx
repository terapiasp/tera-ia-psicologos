import { CalendarDays, FileText, Home, Settings, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Pacientes",
    href: "/patients",
    icon: Users,
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-16 transition-all duration-300 z-30",
      isCollapsed ? "md:w-16" : "md:w-64"
    )}>
      <div className="flex flex-col flex-grow pt-5 bg-gradient-soft border-r overflow-y-auto">
        <div className="flex items-center justify-between flex-shrink-0 px-4">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/c7f3201c-cdcf-40a7-a61f-d24a818c080e.png" 
              alt="Tera IA" 
              className="h-8 w-8 rounded-lg"
            />
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Tera IA
                </h1>
                <p className="text-xs text-muted-foreground">Dashboard Psicológico</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn("flex-shrink-0 h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")}
                  aria-hidden="true"
                />
                {!isCollapsed && item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}