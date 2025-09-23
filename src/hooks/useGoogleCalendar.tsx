import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if Google Calendar is connected
  const { data: isConnected, isLoading } = useQuery({
    queryKey: ['google-calendar-status', user?.id],
    queryFn: () => {
      return profile?.google_calendar_connected || false;
    },
    enabled: !!user?.id && !!profile,
  });

  // Connect to Google Calendar
  const connectCalendar = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open Google OAuth in a popup window
        const popup = window.open(
          data.authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Poll for popup to close (user completed auth)
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Refresh profile data to check if connection was successful
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
            queryClient.invalidateQueries({ queryKey: ['google-calendar-status', user.id] });
            setIsConnecting(false);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup?.closed) {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
          }
        }, 300000);
      }
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  }, [user, queryClient]);

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.functions.invoke('google-auth', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status', user?.id] });
    },
  });

  // Sync session to Google Calendar
  const syncSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionData, 
      action 
    }: { 
      sessionData: {
        id: string;
        scheduled_at: string;
        duration_minutes: number;
        patient_name: string;
        notes?: string;
        status: string;
      };
      action: 'create' | 'update' | 'delete';
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { sessionData, action },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
  });

  return {
    isConnected: isConnected || false,
    isLoading,
    connectCalendar,
    disconnectCalendar: disconnectMutation.mutate,
    isConnecting,
    isDisconnecting: disconnectMutation.isPending,
    syncSession: syncSessionMutation.mutate,
    isSyncing: syncSessionMutation.isPending,
  };
};