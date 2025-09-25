import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SessionLinkStatus {
  status: 'active' | 'expiring' | 'expired' | 'none';
  daysSinceLastUse?: number;
  resolvedLink?: string;
}

export const useSessionLinks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para resolver o link final de um paciente
  const getResolvedLink = (patient: any): string | null => {
    if (!patient?.link_type) return null;
    
    if (patient.link_type === 'recurring_meet' && patient.recurring_meet_code) {
      return `https://meet.google.com/${patient.recurring_meet_code}`;
    }
    
    if (patient.link_type === 'external' && patient.external_session_link) {
      return patient.external_session_link;
    }
    
    return null;
  };

  // Função para calcular o status do link
  const getLinkStatus = (patient: any): SessionLinkStatus => {
    if (!patient?.link_type) {
      return { status: 'none' };
    }
    
    if (patient.link_type === 'external') {
      return { 
        status: 'active', 
        resolvedLink: patient.external_session_link 
      };
    }
    
    // Para Google Meet, verificar último uso
    const lastUsed = patient.link_last_used ? new Date(patient.link_last_used) : null;
    const created = patient.link_created_at ? new Date(patient.link_created_at) : new Date();
    const referenceDate = lastUsed || created;
    const daysSince = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const resolvedLink = getResolvedLink(patient);
    
    if (daysSince >= 30) {
      return { 
        status: 'expired', 
        daysSinceLastUse: daysSince, 
        resolvedLink 
      };
    } else if (daysSince >= 25) {
      return { 
        status: 'expiring', 
        daysSinceLastUse: daysSince, 
        resolvedLink 
      };
    } else {
      return { 
        status: 'active', 
        daysSinceLastUse: daysSince, 
        resolvedLink 
      };
    }
  };

  // Mutation para atualizar o último uso do link
  const updateLinkLastUsedMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .update({ 
          link_last_used: new Date().toISOString() 
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
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar último uso do link:', error);
    },
  });

  // Mutation para renovar código do Google Meet
  const renewMeetCodeMutation = useMutation({
    mutationFn: async ({ patientId, newCode }: { patientId: string; newCode: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('patients')
        .update({ 
          recurring_meet_code: newCode,
          link_created_at: new Date().toISOString(),
          link_last_used: null // Reset last used since it's a new code
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
        title: "Código renovado",
        description: "Código do Google Meet renovado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao renovar código do Meet",
        variant: "destructive",
      });
    },
  });

  return {
    getResolvedLink,
    getLinkStatus,
    updateLinkLastUsed: updateLinkLastUsedMutation.mutate,
    renewMeetCode: renewMeetCodeMutation.mutate,
    isUpdatingLastUsed: updateLinkLastUsedMutation.isPending,
    isRenewingCode: renewMeetCodeMutation.isPending,
  };
};