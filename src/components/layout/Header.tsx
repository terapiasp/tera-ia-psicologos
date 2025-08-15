import { Bell, Calendar, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/c7f3201c-cdcf-40a7-a61f-d24a818c080e.png" 
              alt="Tera IA" 
              className="h-8 w-8 rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Tera IA
              </h1>
              <p className="text-xs text-muted-foreground">Dashboard Psicológico</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Agenda</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h4 className="font-medium">Notificações</h4>
              </div>
              <DropdownMenuItem className="p-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Sessão em 30 minutos</p>
                  <p className="text-xs text-muted-foreground">Ana Silva - Terapia Individual</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Pagamento pendente</p>
                  <p className="text-xs text-muted-foreground">João Santos - R$ 120,00</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
                <span className="hidden md:block ml-2">Dr. Maria Silva</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}