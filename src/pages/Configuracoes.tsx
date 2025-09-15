import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Phone, Mail, FileText, Building, CreditCard, Bell, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, type TipoCobranca } from "@/hooks/useProfile";

const Configuracoes = () => {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    crp_number: "",
    clinic_name: "",
    bio: "",
    address: "",
    city: "",
    state: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      onboarding_completed: true,
    });
  };

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
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                  <p className="text-muted-foreground">
                    Gerencie seu perfil e preferências da plataforma
                  </p>
                </div>
                {!profile?.onboarding_completed && (
                  <Badge variant="secondary">
                    Perfil Incompleto
                  </Badge>
                )}
              </div>

              <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="perfil" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger value="cobranca" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cobrança
                  </TabsTrigger>
                  <TabsTrigger value="notificacoes" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificações
                  </TabsTrigger>
                  <TabsTrigger value="conta" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Conta
                  </TabsTrigger>
                </TabsList>

                {/* Aba: Perfil */}
                <TabsContent value="perfil" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card de Informações Básicas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Informações Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-10 w-10 text-primary" />
                          </div>
                          <h3 className="font-medium">{profile?.name || "Nome não informado"}</h3>
                          <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <span>{profile?.phone || "Não informado"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>CRP: {profile?.crp_number || "Não informado"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4" />
                            <span>{profile?.clinic_name || "Não informado"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {profile?.city && profile?.state 
                                ? `${profile.city}, ${profile.state}` 
                                : "Localização não informada"
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Formulário de Edição do Perfil */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Editar Perfil</CardTitle>
                          <CardDescription>
                            Mantenha suas informações profissionais atualizadas
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                  id="name"
                                  value={formData.name}
                                  onChange={(e) => handleInputChange("name", e.target.value)}
                                  placeholder="Seu nome completo"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                                <Input
                                  id="phone"
                                  value={formData.phone}
                                  onChange={(e) => handleInputChange("phone", e.target.value)}
                                  placeholder="(11) 99999-9999"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="crp_number">Número do CRP</Label>
                                <Input
                                  id="crp_number"
                                  value={formData.crp_number}
                                  onChange={(e) => handleInputChange("crp_number", e.target.value)}
                                  placeholder="Ex: 06/123456"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="clinic_name">Nome da Clínica/Consultório</Label>
                                <Input
                                  id="clinic_name"
                                  value={formData.clinic_name}
                                  onChange={(e) => handleInputChange("clinic_name", e.target.value)}
                                  placeholder="Nome do local de trabalho"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bio">Biografia Profissional</Label>
                              <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => handleInputChange("bio", e.target.value)}
                                placeholder="Conte um pouco sobre sua experiência e especialidades..."
                                rows={4}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="address">Endereço do Consultório</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                placeholder="Rua, número, bairro"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input
                                  id="city"
                                  value={formData.city}
                                  onChange={(e) => handleInputChange("city", e.target.value)}
                                  placeholder="São Paulo"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="state">Estado</Label>
                                <Input
                                  id="state"
                                  value={formData.state}
                                  onChange={(e) => handleInputChange("state", e.target.value)}
                                  placeholder="SP"
                                />
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <Button 
                                type="submit" 
                                disabled={isUpdating}
                                className="bg-gradient-primary hover:opacity-90"
                              >
                                {isUpdating ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Aba: Cobrança */}
                <TabsContent value="cobranca" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Preferências de Cobrança
                      </CardTitle>
                      <CardDescription>
                        Configure como deseja gerenciar os pagamentos dos seus pacientes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo_cobranca">Tipo de Cobrança</Label>
                          <Select 
                            value={formData.tipo_cobranca} 
                            onValueChange={(value: TipoCobranca) => handleInputChange("tipo_cobranca", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIA_FIXO">Dia Fixo do Mês</SelectItem>
                              <SelectItem value="POR_SESSAO">Por Sessão</SelectItem>
                              <SelectItem value="PACOTE_SESSOES">Pacote de Sessões</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="parametro_cobranca">
                            {formData.tipo_cobranca === "DIA_FIXO" && "Dia do Vencimento"}
                            {formData.tipo_cobranca === "PACOTE_SESSOES" && "Quantidade de Sessões"}
                            {formData.tipo_cobranca === "POR_SESSAO" && "Dias de Antecedência"}
                          </Label>
                          <Input
                            id="parametro_cobranca"
                            type="number"
                            value={formData.parametro_cobranca}
                            onChange={(e) => handleInputChange("parametro_cobranca", Number(e.target.value))}
                            placeholder="10"
                            min="1"
                            max={formData.tipo_cobranca === "DIA_FIXO" ? "31" : "365"}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Como funciona:</h4>
                        <div className="text-sm text-muted-foreground">
                          {formData.tipo_cobranca === "DIA_FIXO" && (
                            <p>Os pacientes serão cobrados todo dia {formData.parametro_cobranca} do mês, independente da quantidade de sessões.</p>
                          )}
                          {formData.tipo_cobranca === "POR_SESSAO" && (
                            <p>Uma cobrança será gerada {formData.parametro_cobranca} dias antes de cada sessão agendada.</p>
                          )}
                          {formData.tipo_cobranca === "PACOTE_SESSOES" && (
                            <p>Os pacientes pagam por pacotes de {formData.parametro_cobranca} sessões antecipadamente.</p>
                          )}
                        </div>
                      </div>

                      <Button 
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        {isUpdating ? "Salvando..." : "Salvar Preferências"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba: Notificações */}
                <TabsContent value="notificacoes" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Templates de Notificação
                      </CardTitle>
                      <CardDescription>
                        Personalize as mensagens automáticas enviadas aos seus pacientes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="template_lembrete_sessao">Template - Lembrete de Sessão</Label>
                        <Textarea
                          id="template_lembrete_sessao"
                          value={formData.template_lembrete_sessao}
                          onChange={(e) => handleInputChange("template_lembrete_sessao", e.target.value)}
                          placeholder="Olá, {{paciente}}! Este é um lembrete da sua sessão agendada para {{data_hora}}. Até breve!"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis disponíveis: {`{{paciente}}`}, {`{{data_hora}}`}, {`{{valor}}`}, {`{{local}}`}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="template_lembrete_pagamento">Template - Lembrete de Pagamento</Label>
                        <Textarea
                          id="template_lembrete_pagamento"
                          value={formData.template_lembrete_pagamento}
                          onChange={(e) => handleInputChange("template_lembrete_pagamento", e.target.value)}
                          placeholder="Olá, {{paciente}}! Este é um lembrete sobre o pagamento da sua terapia, com vencimento em {{vencimento}}. Obrigado!"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Variáveis disponíveis: {`{{paciente}}`}, {`{{vencimento}}`}, {`{{valor}}`}, {`{{metodo_pagamento}}`}
                        </p>
                      </div>

                      <Button 
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        {isUpdating ? "Salvando..." : "Salvar Templates"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba: Conta */}
                <TabsContent value="conta" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Configurações da Conta
                      </CardTitle>
                      <CardDescription>
                        Gerencie suas configurações de segurança e privacidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email da Conta</Label>
                          <Input
                            value={profile?.email || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            O email não pode ser alterado no momento
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Fuso Horário</Label>
                          <Select value={profile?.timezone || "America/Sao_Paulo"} disabled>
                            <SelectTrigger className="bg-muted">
                              <SelectValue />
                            </SelectTrigger>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Configuração automática baseada na localização
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Segurança e Privacidade</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>• Todos os dados dos pacientes são criptografados</p>
                          <p>• Você tem controle total sobre suas informações</p>
                          <p>• Backup automático diário dos seus dados</p>
                          <p>• Conformidade total com LGPD e normas do CFP</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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