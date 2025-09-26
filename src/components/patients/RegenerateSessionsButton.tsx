import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';

interface RegenerateSessionsButtonProps {
  patientId: string;
  patientName: string;
}

export const RegenerateSessionsButton: React.FC<RegenerateSessionsButtonProps> = ({
  patientId,
  patientName
}) => {
  const { forceRegeneratePatientSessions } = useRecurringSchedules();

  const handleRegenerate = async () => {
    try {
      await forceRegeneratePatientSessions(patientId);
    } catch (error) {
      console.error('Erro ao regenerar sessões:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Regenerar Sessões
    </Button>
  );
};