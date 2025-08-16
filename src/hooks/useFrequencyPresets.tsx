import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { FrequencyPreset, CreateFrequencyPresetData, RecurrencePattern } from "@/types/frequency";

export const useFrequencyPresets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch frequency presets
  const { data: presets = [], isLoading, error } = useQuery({
    queryKey: ['frequency-presets', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('frequency_presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FrequencyPreset[];
    },
    enabled: !!user?.id,
  });

  // Create frequency preset
  const createPresetMutation = useMutation({
    mutationFn: async (presetData: CreateFrequencyPresetData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('frequency_presets')
        .insert({
          ...presetData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequency-presets'] });
      toast({
        title: "Frequência personalizada criada",
        description: "A nova frequência foi salva com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar frequência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update frequency preset
  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateFrequencyPresetData> }) => {
      const { data, error } = await supabase
        .from('frequency_presets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequency-presets'] });
      toast({
        title: "Frequência atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar frequência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete frequency preset
  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('frequency_presets')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequency-presets'] });
      toast({
        title: "Frequência removida",
        description: "A frequência personalizada foi removida.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover frequência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to calculate estimated sessions per month
  const calculateEstimatedSessions = (pattern: RecurrencePattern): number => {
    switch (pattern.frequency) {
      case 'weekly':
        return (pattern.daysOfWeek?.length || 1) * 4 * pattern.interval;
      case 'biweekly':
        return (pattern.daysOfWeek?.length || 1) * 2 * pattern.interval;
      case 'monthly':
        return (pattern.daysOfMonth?.length || pattern.sessionsPerCycle || 1) * pattern.interval;
      case 'custom':
        return pattern.sessionsPerCycle || 4; // Default fallback
      default:
        return 4;
    }
  };

  return {
    presets,
    isLoading,
    error,
    createPreset: createPresetMutation.mutate,
    updatePreset: updatePresetMutation.mutate,
    deletePreset: deletePresetMutation.mutate,
    isCreating: createPresetMutation.isPending,
    isUpdating: updatePresetMutation.isPending,
    isDeleting: deletePresetMutation.isPending,
    calculateEstimatedSessions,
  };
};