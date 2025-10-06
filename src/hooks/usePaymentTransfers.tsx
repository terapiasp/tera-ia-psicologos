import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PaymentTransfer {
  id: string;
  user_id: string;
  patient_id?: string;
  transfer_date: string;
  amount: number;
  reference?: string;
  sender_name?: string;
  sender_bank?: string;
  receiver_name?: string;
  receiver_bank?: string;
  validation_status: 'pending' | 'approved' | 'divergent' | 'manual';
  validation_method?: string;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const usePaymentTransfers = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading, error } = useQuery({
    queryKey: ['payment_transfers', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      let query = supabase
        .from('payment_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('transfer_date', { ascending: false });

      if (startDate) {
        query = query.gte('transfer_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('transfer_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PaymentTransfer[];
    },
    enabled: !!user?.id,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (transfer: Partial<PaymentTransfer>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('payment_transfers')
        .insert({
          ...transfer,
          user_id: user.id,
          created_by: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_transfers'] });
      toast({
        title: "Transferência registrada",
        description: "A transferência foi registrada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar transferência",
        variant: "destructive",
      });
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PaymentTransfer> }) => {
      const { data, error } = await supabase
        .from('payment_transfers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_transfers'] });
      toast({
        title: "Atualizado",
        description: "Transferência atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar transferência",
        variant: "destructive",
      });
    },
  });

  return {
    transfers,
    isLoading,
    error,
    createTransfer: createTransferMutation.mutate,
    updateTransfer: updateTransferMutation.mutate,
    isCreating: createTransferMutation.isPending,
    isUpdating: updateTransferMutation.isPending,
  };
};
