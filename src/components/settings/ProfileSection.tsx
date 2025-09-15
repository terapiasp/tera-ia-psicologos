import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, MapPin, Phone, FileText, Building, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Profile } from "@/hooks/useProfile";

interface ProfileSectionProps {
  profile: Profile | undefined;
  formData: {
    name: string;
    phone: string;
    crp_number: string;
    clinic_name: string;
    bio: string;
    address: string;
    city: string;
    state: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isUpdating: boolean;
}

export const ProfileSection = ({ profile, formData, onInputChange, onSubmit, isUpdating }: ProfileSectionProps) => {
  
  const validateCRP = (crp: string): boolean => {
    // Formato: XX/XXXXXX ou XX/XXXXX
    const crpRegex = /^\d{2}\/\d{5,6}$/;
    return crpRegex.test(crp);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Valida se tem 10 ou 11 dígitos (com DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const formatPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const getProfileCompleteness = () => {
    const requiredFields = ['name', 'phone', 'crp_number'];
    const optionalFields = ['clinic_name', 'bio', 'address', 'city', 'state'];
    
    const requiredComplete = requiredFields.filter(field => formData[field as keyof typeof formData]).length;
    const optionalComplete = optionalFields.filter(field => formData[field as keyof typeof formData]).length;
    
    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    
    return {
      required: {
        complete: requiredComplete,
        total: totalRequired,
        percentage: Math.round((requiredComplete / totalRequired) * 100)
      },
      optional: {
        complete: optionalComplete,
        total: totalOptional,
        percentage: Math.round((optionalComplete / totalOptional) * 100)
      }
    };
  };

  const completeness = getProfileCompleteness();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card de Informações e Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar e Info Básica */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h3 className="font-medium">{profile?.name || "Nome não informado"}</h3>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          
          <Separator />

          {/* Status de Completude */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Informações Obrigatórias</span>
              <span className="text-sm text-muted-foreground">{completeness.required.complete}/{completeness.required.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness.required.percentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Informações Adicionais</span>
              <span className="text-sm text-muted-foreground">{completeness.optional.complete}/{completeness.optional.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness.optional.percentage}%` }}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Informações Atuais */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <span>{profile?.phone || "Não informado"}</span>
              {formData.phone && (
                validatePhone(formData.phone) 
                  ? <CheckCircle className="h-4 w-4 text-success" />
                  : <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>CRP: {profile?.crp_number || "Não informado"}</span>
              {formData.crp_number && (
                validateCRP(formData.crp_number) 
                  ? <CheckCircle className="h-4 w-4 text-success" />
                  : <AlertCircle className="h-4 w-4 text-destructive" />
              )}
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
            <CardTitle>Editar Informações</CardTitle>
            <CardDescription>
              Mantenha suas informações profissionais sempre atualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Informações Obrigatórias
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Nome Completo *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Seu nome completo como registrado no CRP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => onInputChange("name", e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className={!formData.name ? "border-destructive" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      Telefone/WhatsApp *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Usado para contato e notificações importantes</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        if (formatted.replace(/\D/g, '').length <= 11) {
                          onInputChange("phone", formatted);
                        }
                      }}
                      placeholder="(11) 99999-9999"
                      className={formData.phone && !validatePhone(formData.phone) ? "border-destructive" : ""}
                    />
                    {formData.phone && !validatePhone(formData.phone) && (
                      <p className="text-xs text-destructive">Formato inválido. Use (XX) XXXXX-XXXX</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crp_number" className="flex items-center gap-2">
                    Número do CRP *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Formato: XX/XXXXXX (região/número)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="crp_number"
                    value={formData.crp_number}
                    onChange={(e) => onInputChange("crp_number", e.target.value)}
                    placeholder="Ex: 06/123456"
                    className={formData.crp_number && !validateCRP(formData.crp_number) ? "border-destructive" : ""}
                  />
                  {formData.crp_number && !validateCRP(formData.crp_number) && (
                    <p className="text-xs text-destructive">Formato inválido. Use XX/XXXXXX</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informações Opcionais */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Informações Adicionais
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Nome da Clínica/Consultório</Label>
                  <Input
                    id="clinic_name"
                    value={formData.clinic_name}
                    onChange={(e) => onInputChange("clinic_name", e.target.value)}
                    placeholder="Nome do local de trabalho"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia Profissional</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => onInputChange("bio", e.target.value)}
                    placeholder="Conte um pouco sobre sua experiência e especialidades..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/500 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço do Consultório</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => onInputChange("address", e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => onInputChange("city", e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => onInputChange("state", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isUpdating || !formData.name || !validatePhone(formData.phone) || (formData.crp_number && !validateCRP(formData.crp_number))}
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
  );
};