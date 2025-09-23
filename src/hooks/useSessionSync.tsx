import { useEffect } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';

interface SessionData {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  patient_name: string;
  notes?: string;
  status: string;
}

export const useSessionSync = () => {
  const { isConnected, syncSession } = useGoogleCalendar();

  const syncSessionToCalendar = async (
    sessionData: SessionData, 
    action: 'create' | 'update' | 'delete'
  ) => {
    if (!isConnected) return;
    
    try {
      syncSession({ sessionData, action });
    } catch (error) {
      console.error('Error syncing session to Google Calendar:', error);
      // Fail silently to not interrupt user workflow
    }
  };

  return {
    syncSessionToCalendar,
    isConnected,
  };
};