import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEncryption } from "@/hooks/useEncryption";
import { Skeleton } from "@/components/ui/skeleton";

export function EncryptionStatus() {
  const { isInitialized, isLoading, hasKey } = useEncryption();

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!hasKey || !isInitialized) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Criptografia Não Disponível</AlertTitle>
        <AlertDescription>
          Não foi possível inicializar a criptografia. Recarregue a página ou entre em contato com o suporte.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Shield className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">Dados Protegidos</AlertTitle>
      <AlertDescription>
        <div className="flex items-center gap-2">
          <Lock className="h-3 w-3" />
          <span className="text-sm">
            Suas notas clínicas estão protegidas com criptografia end-to-end. 
            Apenas você pode acessar estes dados com sua chave pessoal.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
