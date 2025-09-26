import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { forceFixRecurringSessions } from '@/utils/fixRecurringSessions';
import { useToast } from '@/components/ui/use-toast';

export const FixRecurringButton: React.FC = () => {
  const { toast } = useToast();

  const handleFix = async () => {
    try {
      await forceFixRecurringSessions();
      toast({
        title: "Correção executada",
        description: "Sessões recorrentes foram regeneradas para Dan, Jean e Nereu!",
      });
      
      // Recarregar a página para ver as mudanças
      window.location.reload();
    } catch (error) {
      console.error('Erro ao executar correção:', error);
      toast({
        title: "Erro",
        description: "Erro ao regenerar as sessões",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleFix}
      className="gap-2"
    >
      <Wrench className="h-4 w-4" />
      Corrigir Dan, Jean e Nereu
    </Button>
  );
};