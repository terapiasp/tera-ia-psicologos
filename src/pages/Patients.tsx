import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Patient {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  whatsapp: string;
  birth_date?: string;
  therapy_type: string;
  frequency: string;
  session_mode: string;
  status: string;
  created_at: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTherapyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'individual_adult': 'Individual Adulto',
      'individual_child': 'Individual Infantil',
      'individual_teen': 'Individual Adolescente',
      'couple': 'Terapia de Casal',
      'family': 'Terapia Familiar',
      'group': 'Terapia em Grupo'
    };
    return types[type] || type;
  };

  const getFrequencyLabel = (frequency: string) => {
    const frequencies: Record<string, string> = {
      'weekly': 'Semanal',
      'biweekly': 'Quinzenal',
      'monthly': 'Mensal',
      'custom': 'Personalizada'
    };
    return frequencies[frequency] || frequency;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'paused': 'Pausado',
      'finished': 'Finalizado'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-6">
            <div className="space-y-6">
              <div className="h-8 bg-muted animate-pulse rounded"></div>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
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
        <main className="flex-1 md:ml-64">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                <p className="text-muted-foreground">
                  Gerencie seus pacientes e acompanhe o histórico de atendimentos
                </p>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Paciente
              </Button>
            </div>

            {patients.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum paciente cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece adicionando seu primeiro paciente
                  </p>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Paciente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {patients.map((patient) => (
                  <Card key={patient.id} className="hover:shadow-soft transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {patient.name}
                            {patient.nickname && (
                              <span className="text-muted-foreground font-normal">
                                {" "}({patient.nickname})
                              </span>
                            )}
                          </CardTitle>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                            <span>{getTherapyTypeLabel(patient.therapy_type)}</span>
                            <span>•</span>
                            <span>{getFrequencyLabel(patient.frequency)}</span>
                            <span>•</span>
                            <span>{patient.session_mode === 'online' ? 'Online' : 'Presencial'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            patient.status === 'active' 
                              ? 'bg-success/10 text-success' 
                              : patient.status === 'paused'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getStatusLabel(patient.status)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {patient.email && (
                          <div>
                            <span className="font-medium">Email:</span>
                            <p className="text-muted-foreground">{patient.email}</p>
                          </div>
                        )}
                        {patient.whatsapp && (
                          <div>
                            <span className="font-medium">WhatsApp:</span>
                            <p className="text-muted-foreground">{patient.whatsapp}</p>
                          </div>
                        )}
                        {patient.birth_date && (
                          <div>
                            <span className="font-medium">Data de Nascimento:</span>
                            <p className="text-muted-foreground">
                              {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Patients;