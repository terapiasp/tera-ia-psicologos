import { Bell, Calendar, LogOut, Menu, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, FileText, Home, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Pacientes", href: "/patients", icon: Users },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Header() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = location.pathname !== '/';
  
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  const handleLogout = async () => {
    try {
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logout realizado com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout: " + error.message,
        variant: "destructive"
      });
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Menu hambúrguer para mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 pb-6 border-b">
                  <img 
                    src="/lovable-uploads/c7f3201c-cdcf-40a7-a61f-d24a818c080e.png" 
                    alt="Tera IA" 
                    className="h-8 w-8 rounded-lg" 
                  />
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                      Tera IA
                    </h2>
                    <p className="text-xs text-muted-foreground">Menu Principal</p>
                  </div>
                </div>
                
                <nav className="flex-1 py-6">
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                            isActive
                              ? "bg-gradient-primary text-white shadow-soft"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão de voltar */}
          {canGoBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
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
              <p className="text-xs text-muted-foreground">Dashboard</p>
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
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
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
              <Button className="bg-gradient-primary text-white border-transparent hover:opacity-90 transition-opacity duration-300" size="sm">
                <User className="h-4 w-4" />
                <span className="hidden md:block ml-2">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}