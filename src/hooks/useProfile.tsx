
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export type TipoCobranca = 'DIA_FIXO' | 'POR_SESSAO' | 'PACOTE_SESSOES';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  crp_number?: string;
  clinic_name?: string;
  bio?: string;
  avatar_url?: string;
  timezone: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  onboarding_completed: boolean;
  metadata: Record<string, any>;
  tipo_cobranca?: TipoCobranca;
  parametro_cobranca?: number;
  template_lembrete_sessao?: string;
  template_lembrete_pagamento?: string;
  default_payment_scheme?: 'fixed_day' | 'per_period' | 'per_session';
  default_payment_day?: number;
  default_payment_period_sessions?: number;
  pix_key_type?: 'email' | 'cpf' | 'cnpj' | 'telefone' | 'random';
  pix_key_value?: string;
  pix_bank_name?: string;
  pix_allows_dynamic_value?: boolean;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  pix_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
};
