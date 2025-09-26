import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useRecurringSchedules } from '@/hooks/useRecurringSchedules';

export const IntegrityChecker: React.FC = () => {
  const { checkIntegrityAndFix } = useRecurringSchedules();

  const handleCheck = async () => {
    try {
      await checkIntegrityAndFix();
    } catch (error) {
      console.error('Erro ao verificar integridade:', error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleCheck}
      className="gap-2"
    >
      <CheckCircle className="h-4 w-4" />
      Verificar Integridade
    </Button>
  );
};