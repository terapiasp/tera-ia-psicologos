import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Bell, Shield, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, type TipoCobranca } from "@/hooks/useProfile";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Lista de timezones com prioridade para Brasil
const TIMEZONES = [
  // Timezones do Brasil (prioritários)
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)", country: "Brasil" },
  { value: "America/Manaus", label: "Manaus (UTC-4)", country: "Brasil" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-5)", country: "Brasil" },
  
  // Timezones Internacionais (ordenados por UTC offset)
  { value: "Pacific/Midway", label: "Midway (UTC-11)", country: "EUA" },
  { value: "Pacific/Honolulu", label: "Honolulu (UTC-10)", country: "EUA" },
  { value: "America/Anchorage", label: "Anchorage (UTC-9)", country: "EUA" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)", country: "EUA" },
  { value: "America/Denver", label: "Denver (UTC-7)", country: "EUA" },
  { value: "America/Chicago", label: "Chicago (UTC-6)", country: "EUA" },
  { value: "America/New_York", label: "Nova York (UTC-5)", country: "EUA" },
  { value: "America/Caracas", label: "Caracas (UTC-4)", country: "Venezuela" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)", country: "Argentina" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)", country: "Brasil" },
  { value: "Atlantic/Azores", label: "Açores (UTC-1)", country: "Portugal" },
  { value: "Europe/London", label: "Londres (UTC+0)", country: "Reino Unido" },
  { value: "Europe/Paris", label: "Paris (UTC+1)", country: "França" },
  { value: "Europe/Berlin", label: "Berlim (UTC+1)", country: "Alemanha" },
  { value: "Europe/Rome", label: "Roma (UTC+1)", country: "Itália" },
  { value: "Europe/Athens", label: "Atenas (UTC+2)", country: "Grécia" },
  { value: "Europe/Moscow", label: "Moscou (UTC+3)", country: "Rússia" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)", country: "EAU" },
  { value: "Asia/Karachi", label: "Karachi (UTC+5)", country: "Paquistão" },
  { value: "Asia/Dhaka", label: "Dhaka (UTC+6)", country: "Bangladesh" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)", country: "Tailândia" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)", country: "China" },
  { value: "Asia/Tokyo", label: "Tóquio (UTC+9)", country: "Japão" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10)", country: "Austrália" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12)", country: "Nova Zelândia" },
];

const Configuracoes = () => {
  const location = useLocation();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  
  // Detectar qual aba abrir baseado no hash da URL
  const getInitialTab = () => {
    const hash = location.hash.substring(1); // Remove o #
    if (['perfil', 'cobranca', 'notificacoes', 'conta'].includes(hash)) {
      return hash;
    }
    return 'perfil';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    crp_number: "",
    clinic_name: "",
    bio: "",
    address: "",
    city: "",
    state: "",
    timezone: "America/Sao_Paulo",
    tipo_cobranca: "DIA_FIXO" as TipoCobranca,
    parametro_cobranca: 10,
    template_lembrete_sessao: "",
    template_lembrete_pagamento: "",
  });

  // Atualizar formData quando o profile carrega
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        crp_number: profile.crp_number || "",
        clinic_name: profile.clinic_name || "",
        bio: profile.bio || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        timezone: profile.timezone || "America/Sao_Paulo",
        tipo_cobranca: (profile.tipo_cobranca as TipoCobranca) || "DIA_FIXO",
        parametro_cobranca: profile.parametro_cobranca || 10,
        template_lembrete_sessao: profile.template_lembrete_sessao || "Olá, {{paciente}}! Este é um lembrete da sua sessão agendada para {{data_hora}}. Até breve!",
        template_lembrete_pagamento: profile.template_lembrete_pagamento || "Olá, {{paciente}}! Este é um lembrete sobre o pagamento da sua terapia, com vencimento em {{vencimento}}. Obrigado!",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProfile({
      ...formData,
      onboarding_completed: true,
    });
  };

  const getProfileStatus = () => {
    const requiredFields = ['name', 'phone', 'crp_number'];
    const missingRequired = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingRequired.length > 0) {
      return {
        status: 'incomplete',
        message: `${missingRequired.length} campo(s) obrigatório(s) pendente(s)`,
        variant: 'destructive' as const
      };
    }
    
    if (!profile?.onboarding_completed) {
      return {
        status: 'pending',
        message: 'Perfil completo - salve para finalizar',
        variant: 'secondary' as const
      };
    }
    
    return {
      status: 'complete',
      message: 'Perfil completo',
      variant: 'outline' as const
    };
  };

  const profileStatus = getProfileStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 transition-all duration-300">
            <div className="p-6">
              <Skeleton className="h-16 w-full mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Gerencie seu perfil e preferências da plataforma
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={profileStatus.variant}
                    className="flex items-center gap-2"
                  >
                    {profileStatus.status === 'incomplete' && <AlertTriangle className="h-3 w-3" />}
                    {profileStatus.message}
                  </Badge>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent md:bg-muted p-0 md:p-1">
                  <TabsTrigger value="perfil" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </TabsTrigger>
                  <TabsTrigger value="cobranca" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>Cobrança</span>
                  </TabsTrigger>
                  <TabsTrigger value="notificacoes" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                    <Bell className="h-4 w-4" />
                    <span className="hidden md:inline">Notificações</span>
                    <span className="md:hidden">Notif.</span>
                  </TabsTrigger>
                  <TabsTrigger value="conta" className="flex-col md:flex-row gap-1 md:gap-2 py-2 md:py-1.5 text-xs md:text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Conta</span>
                  </TabsTrigger>
                </TabsList>

                {/* Aba: Perfil */}
                <TabsContent value="perfil" className="space-y-4 md:space-y-6">
                  <ProfileSection
                    profile={profile}
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isUpdating={isUpdating}
                  />
                </TabsContent>

                {/* Aba: Cobrança */}
                <TabsContent value="cobranca" className="space-y-4 md:space-y-6">
                  <BillingSection
                    formData={{
                      tipo_cobranca: formData.tipo_cobranca,
                      parametro_cobranca: formData.parametro_cobranca
                    }}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isUpdating={isUpdating}
                  />
                </TabsContent>

                {/* Aba: Notificações */}
                <TabsContent value="notificacoes" className="space-y-4 md:space-y-6">
                  <NotificationsSection
                    formData={{
                      template_lembrete_sessao: formData.template_lembrete_sessao,
                      template_lembrete_pagamento: formData.template_lembrete_pagamento
                    }}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isUpdating={isUpdating}
                  />
                </TabsContent>

                {/* Aba: Conta */}
                <TabsContent value="conta" className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Informações da Conta */}
                    <Card>
                      <CardHeader className="p-4 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Shield className="h-5 w-5" />
                          Informações da Conta
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="space-y-4 p-4 md:p-6">
                         <div className="space-y-2">
                           <div className="text-sm font-medium">Email</div>
                           <div className="text-sm text-muted-foreground">{profile?.email || ""}</div>
                         </div>
                         
                         <div className="space-y-2">
                           <Label htmlFor="timezone" className="text-sm font-medium">Fuso Horário</Label>
                           <Select 
                             value={formData.timezone} 
                             onValueChange={(value) => handleInputChange('timezone', value)}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Selecione o fuso horário" />
                             </SelectTrigger>
                             <SelectContent className="max-h-60">
                               {/* Timezones do Brasil */}
                               <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                 Brasil
                               </div>
                               {TIMEZONES.filter(tz => tz.country === "Brasil").map((timezone) => (
                                 <SelectItem key={timezone.value} value={timezone.value}>
                                   {timezone.label}
                                 </SelectItem>
                               ))}
                               
                               {/* Separador */}
                               <div className="border-t my-1"></div>
                               
                               {/* Timezones Internacionais */}
                               <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                 Internacional
                               </div>
                               {TIMEZONES.filter(tz => tz.country !== "Brasil").map((timezone) => (
                                 <SelectItem key={timezone.value} value={timezone.value}>
                                   {timezone.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         
                         <div className="space-y-2">
                           <div className="text-sm font-medium">Membro desde</div>
                           <div className="text-sm text-muted-foreground">
                             {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : ""}
                           </div>
                         </div>
                         
                         <Button 
                           onClick={handleSubmit} 
                           disabled={isUpdating}
                           className="w-full"
                         >
                           {isUpdating ? "Salvando..." : "Salvar Alterações"}
                         </Button>
                       </CardContent>
                    </Card>

                    {/* Segurança e Privacidade */}
                    <Card>
                      <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg md:text-xl">Segurança e Privacidade</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 md:p-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-success mt-0.5" />
                            <div>
                              <h4 className="font-medium">Dados Criptografados</h4>
                              <p className="text-sm text-muted-foreground">
                                Todas as informações dos pacientes são criptografadas
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-success mt-0.5" />
                            <div>
                              <h4 className="font-medium">Conformidade LGPD</h4>
                              <p className="text-sm text-muted-foreground">
                                Sistema em conformidade com a Lei Geral de Proteção de Dados
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-success mt-0.5" />
                            <div>
                              <h4 className="font-medium">Export de Dados</h4>
                              <p className="text-sm text-muted-foreground">
                                Você pode exportar todos os seus dados a qualquer momento
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Configuracoes;