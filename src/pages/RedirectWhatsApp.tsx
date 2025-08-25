import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const normalizePhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return digits.startsWith('55') ? digits : '55' + digits;
  }
  if (digits.length >= 12 && digits.startsWith('55')) return digits;
  return digits.length >= 10 ? '55' + digits : digits;
};

export default function RedirectWhatsApp() {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [attempted, setAttempted] = useState(false);

  const phone = params.get('phone');
  const normalized = useMemo(() => normalizePhoneNumber(phone), [phone]);

  const urlMobile = normalized ? `https://wa.me/${normalized}` : '';
  const urlWeb = normalized ? `https://web.whatsapp.com/send?phone=${normalized}` : '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const primary = isMobile ? urlMobile : urlWeb;
  const secondary = isMobile ? urlWeb : urlMobile;

  useEffect(() => {
    if (!normalized || attempted) return;
    setAttempted(true);

    const tryRedirect = async () => {
      try {
        // Tenta redirecionar via replace (sem criar histórico)
        window.location.replace(primary);
      } catch (e) {
        try {
          window.location.href = primary;
        } catch {}
      }

      // Fallback: tentar a alternativa após um pequeno delay
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          try {
            window.location.replace(secondary);
          } catch {}
        }
      }, 800);

      // Último recurso: copia o link
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText(primary);
          toast({ title: 'Link do WhatsApp copiado', description: 'Cole no navegador para abrir a conversa.' });
        } catch {}
      }, 1500);
    };

    tryRedirect();
  }, [attempted, normalized, primary, secondary, toast]);

  if (!normalized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Número inválido ou ausente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Abrindo WhatsApp…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se a conversa não abrir automaticamente, use um dos botões abaixo.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => (window.location.href = urlMobile)}>
              Abrir no WhatsApp (wa.me)
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => (window.location.href = urlWeb)}>
              Abrir no WhatsApp Web
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(primary);
                  toast({ title: 'Link copiado', description: 'Cole no navegador para abrir.' });
                } catch {}
              }}
            >
              Copiar link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
