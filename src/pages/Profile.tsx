
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, Mail, FileText, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
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
  });

  // Atualizar formData quando o profile carrega
  useState(() => {
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
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full" />
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações profissionais
            </p>
          </div>
          {!profile?.onboarding_completed && (
            <Badge variant="secondary">
              Perfil Incompleto
            </Badge>
          )}
        </div>

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

          {/* Formulário de Edição */}
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
      </div>
    </div>
  );
};

export default Profile;
