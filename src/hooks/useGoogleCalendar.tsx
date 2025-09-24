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
  const [isSyncingAll, setIsSyncingAll] = useState(false);

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

      // Use direct fetch call to support DELETE method
      const session = await supabase.auth.getSession();
      const response = await fetch('https://zrhhaoppytpbytpudywq.supabase.co/functions/v1/google-auth', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao desconectar');
      }

      return await response.json();
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

  // Sync all existing sessions to Google Calendar with rate limiting
  const syncAllSessions = useCallback(async (sessions: any[]) => {
    if (!user || !isConnected || !sessions.length) return;
    
    setIsSyncingAll(true);
    
    try {
      const session = await supabase.auth.getSession();
      const authToken = session.data.session?.access_token;
      
      // Filter only valid sessions
      const validSessions = sessions.filter(sessionData => sessionData.patients?.name);
      
      // Rate limiting: process in batches of 10 sessions with 2 second delay between batches
      const BATCH_SIZE = 10;
      const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < validSessions.length; i += BATCH_SIZE) {
        const batch = validSessions.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(sessionData => 
          supabase.functions.invoke('google-calendar-sync', {
            body: {
              sessionData: {
                id: sessionData.id,
                scheduled_at: sessionData.scheduled_at,
                duration_minutes: sessionData.duration_minutes,
                patient_name: sessionData.patients.name,
                notes: sessionData.notes || '',
                status: sessionData.status,
              },
              action: 'create'
            },
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }).then(
            (result) => {
              if (result.error) throw result.error;
              successCount++;
              return result;
            },
            (error) => {
              errorCount++;
              console.error('Session sync error:', error);
              return error;
            }
          )
        );

        await Promise.allSettled(batchPromises);
        
        // Wait before processing next batch (except for the last batch)
        if (i + BATCH_SIZE < validSessions.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }
      
      console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
      
      if (errorCount > 0 && successCount === 0) {
        throw new Error(`Falha na sincronização. Tente novamente em alguns minutos.`);
      } else if (errorCount > 0) {
        throw new Error(`Sincronização parcial: ${successCount} sessões sincronizadas, ${errorCount} falharam.`);
      }
      
    } catch (error) {
      console.error('Error syncing all sessions:', error);
      throw error;
    } finally {
      setIsSyncingAll(false);
    }
  }, [user, isConnected]);

  return {
    isConnected: isConnected || false,
    isLoading,
    connectCalendar,
    disconnectCalendar: disconnectMutation.mutate,
    isConnecting,
    isDisconnecting: disconnectMutation.isPending,
    syncSession: syncSessionMutation.mutate,
    isSyncing: syncSessionMutation.isPending,
    syncAllSessions,
    isSyncingAll,
  };
};