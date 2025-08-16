import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  whatsapp: string;
  birth_date?: string;
  therapy_type: string;
  frequency: string;
  custom_frequency?: string;
  session_mode: string;
  status: string;
  address?: string;
  service_modality_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  whatsapp: string;
  birth_date?: string;
  therapy_type: string;
  frequency: string;
  custom_frequency?: string;
  session_mode: string;
  address?: string;
  frequency_preset_id?: string;
}

export const usePatients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user?.id,
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patientData: CreatePatientData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...patientData,
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente criado",
        description: "Novo paciente adicionado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar paciente",
        variant: "destructive",
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Patient> }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente atualizado",
        description: "Informações atualizadas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar paciente",
        variant: "destructive",
      });
    },
  });

  return {
    patients,
    isLoading,
    error,
    createPatient: createPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    isCreating: createPatientMutation.isPending,
    isUpdating: updatePatientMutation.isPending,
  };
};