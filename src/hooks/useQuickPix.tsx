import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface QuickPixCode {
  id: string;
  user_id: string;
  txid: string;
  pix_key_type: string;
  pix_key_value: string;
  amount: number;
  description: string | null;
  qr_code_url: string | null;
  pix_code: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export const useQuickPix = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active quick PIX code
  const { data: quickPix, isLoading } = useQuery({
    queryKey: ['quick-pix', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pix_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'quick')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as QuickPixCode | null;
    },
    enabled: !!user?.id,
    // Refetch every 2 seconds if QR code is not ready yet, but only for 30 seconds max
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.qr_code_url) return false;
      
      // Stop refetching after 30 seconds (created_at + 30s)
      const createdAt = new Date(data.created_at).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - createdAt) / 1000;
      
      return elapsedSeconds < 30 ? 2000 : false;
    },
  });

  // Create new quick PIX (deletes previous if exists)
  const createQuickPix = useMutation({
    mutationFn: async (data: {
      pix_key_type: string;
      pix_key_value: string;
      pix_code: string;
      amount: number;
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete previous quick PIX if exists
      if (quickPix?.id) {
        await supabase
          .from('pix_codes')
          .delete()
          .eq('id', quickPix.id);
      }

      // Generate txid from UUID (first 25 chars)
      const txid = crypto.randomUUID().replace(/-/g, '').substring(0, 25);

      const { data: newPix, error } = await supabase
        .from('pix_codes')
        .insert({
          user_id: user.id,
          txid,
          pix_key_type: data.pix_key_type,
          pix_key_value: data.pix_key_value,
          pix_code: data.pix_code,
          amount: data.amount,
          description: data.description || null,
          type: 'quick',
        })
        .select()
        .single();

      if (error) throw error;
      return newPix;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-pix'] });
      toast({
        title: "PIX Rápido gerado",
        description: "O QR Code será gerado em instantes.",
      });
    },
    onError: (error) => {
      console.error('Error creating quick PIX:', error);
      toast({
        title: "Erro ao gerar PIX",
        description: "Não foi possível gerar o código PIX. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete quick PIX
  const deleteQuickPix = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pix_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-pix'] });
      toast({
        title: "PIX deletado",
        description: "O código PIX foi removido.",
      });
    },
    onError: (error) => {
      console.error('Error deleting quick PIX:', error);
      toast({
        title: "Erro ao deletar PIX",
        description: "Não foi possível deletar o código PIX.",
        variant: "destructive",
      });
    },
  });

  return {
    quickPix,
    isLoading,
    createQuickPix,
    deleteQuickPix,
  };
};
