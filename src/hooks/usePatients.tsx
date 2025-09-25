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
  session_value?: number;
  session_duration?: number;
  status: string;
  address?: string;
  session_link?: string; // Legacy field - to be removed
  recurring_meet_code?: string;
  external_session_link?: string;
  link_type?: 'recurring_meet' | 'external' | null;
  link_created_at?: string;
  link_last_used?: string;
  service_modality_id?: string;
  is_archived: boolean;
  archived_at?: string;
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
  session_link?: string; // Legacy field - to be removed
  recurring_meet_code?: string;
  external_session_link?: string;
  link_type?: 'recurring_meet' | 'external' | null;
  link_created_at?: string;
  frequency_preset_id?: string;
  session_value?: number;
  session_duration?: number;
}

export const usePatients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allPatients = [], isLoading, error } = useQuery({
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

  const patients = allPatients.filter(patient => !patient.is_archived);
  const archivedPatients = allPatients.filter(patient => patient.is_archived);

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

  const archivePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .update({ 
          is_archived: true,
          recurring_meet_code: null,
          external_session_link: null,
          link_type: null,
          link_created_at: null,
          link_last_used: null
        })
        .eq('id', patientId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente arquivado",
        description: "Paciente movido para arquivos com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao arquivar paciente",
        variant: "destructive",
      });
    },
  });

  const unarchivePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .update({ is_archived: false })
        .eq('id', patientId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente reativado",
        description: "Paciente retirado dos arquivos com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar paciente",
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Delete related data first
      await Promise.all([
        supabase.from('sessions').delete().eq('patient_id', patientId).eq('user_id', user.id),
        supabase.from('recurring_schedules').delete().eq('patient_id', patientId).eq('user_id', user.id),
        supabase.from('patient_notes').delete().eq('patient_id', patientId).eq('user_id', user.id),
      ]);

      // Delete patient
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "Paciente deletado",
        description: "Todos os dados do paciente foram removidos permanentemente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar paciente",
        variant: "destructive",
      });
    },
  });

  return {
    patients,
    archivedPatients,
    isLoading,
    error,
    createPatient: createPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    archivePatient: archivePatientMutation.mutate,
    unarchivePatient: unarchivePatientMutation.mutate,
    deletePatient: deletePatientMutation.mutate,
    isCreating: createPatientMutation.isPending,
    isUpdating: updatePatientMutation.isPending,
    isArchiving: archivePatientMutation.isPending,
    isUnarchiving: unarchivePatientMutation.isPending,
    isDeleting: deletePatientMutation.isPending,
  };
};