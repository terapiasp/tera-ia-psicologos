import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface SessionValue {
  id: string;
  value: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export const useSessionValues = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session values used by the psychologist
  const { data: sessionValues = [], isLoading } = useQuery({
    queryKey: ['session-values', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get unique session values from patients table
      const { data, error } = await supabase
        .from('patients')
        .select('session_value')
        .eq('user_id', user.id)
        .not('session_value', 'is', null)
        .order('session_value', { ascending: true });

      if (error) throw error;
      
      // Count usage and create array of unique values
      const valueMap = new Map<number, number>();
      data.forEach(patient => {
        if (patient.session_value) {
          const value = patient.session_value;
          valueMap.set(value, (valueMap.get(value) || 0) + 1);
        }
      });

      // Convert to array and sort by usage (most used first), then by value
      const values = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => {
          // First sort by usage count (descending), then by value (ascending)
          if (b.count !== a.count) return b.count - a.count;
          return a.value - b.value;
        });

      // Always include 80 as default if not present
      if (!values.find(v => v.value === 80)) {
        values.unshift({ value: 80, count: 0 });
      }

      return values;
    },
    enabled: !!user?.id,
  });

  // Get suggested values for Quick PIX
  const getSuggestedValues = () => {
    if (sessionValues.length === 0) return [];
    
    const suggestions = new Set<number>();
    
    // Add top 2 most used values
    const topValues = sessionValues.slice(0, 2);
    topValues.forEach(item => suggestions.add(item.value));
    
    // Get the most used value as base
    const baseValue = sessionValues[0].value;
    
    // Add multiples: x2, x4, x8
    suggestions.add(baseValue * 2);
    suggestions.add(baseValue * 4);
    suggestions.add(baseValue * 8);
    
    // Convert to sorted array and limit to 6
    return Array.from(suggestions)
      .sort((a, b) => a - b)
      .slice(0, 6);
  };

  // Get next/previous value for navigation
  const getNavigationValue = (currentValue: number, direction: 'next' | 'prev') => {
    if (sessionValues.length === 0) return currentValue;
    
    const currentIndex = sessionValues.findIndex(sv => sv.value === currentValue);
    
    if (currentIndex === -1) {
      // Current value not in list, return closest value
      const sorted = sessionValues.map(sv => sv.value).sort((a, b) => a - b);
      const closestIndex = sorted.findIndex(v => v >= currentValue);
      if (closestIndex === -1) return sorted[sorted.length - 1];
      return sorted[closestIndex];
    }
    
    if (direction === 'next') {
      return currentIndex < sessionValues.length - 1 
        ? sessionValues[currentIndex + 1].value 
        : sessionValues[0].value;
    } else {
      return currentIndex > 0 
        ? sessionValues[currentIndex - 1].value 
        : sessionValues[sessionValues.length - 1].value;
    }
  };

  return {
    sessionValues,
    isLoading,
    getSuggestedValues,
    getNavigationValue,
  };
};