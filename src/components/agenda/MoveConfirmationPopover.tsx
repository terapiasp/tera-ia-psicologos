import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Session } from '@/hooks/useSessions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User } from 'lucide-react';

interface MoveConfirmationPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: (moveType: 'single' | 'series') => void;
}

export const MoveConfirmationPopover: React.FC<MoveConfirmationPopoverProps> = ({
  open,
  onOpenChange,
  session,
  onConfirm,
}) => {
  if (!session) return null;

  const isRecurring = !!session.schedule_id;
  const sessionDate = new Date(session.scheduled_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Mover Sessão
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {session.patients?.nickname || session.patients?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {format(sessionDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Como você gostaria de proceder com esta alteração?
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            onClick={() => onConfirm('single')}
            className="w-full"
          >
            Mover apenas esta sessão
          </Button>
          
          {isRecurring && (
            <Button
              onClick={() => onConfirm('series')}
              className="w-full"
            >
              Mover todas as sessões futuras desta série
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};