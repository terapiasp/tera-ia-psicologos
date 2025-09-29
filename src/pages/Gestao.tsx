import { Header } from "@/components/layout/Header";
import { useRole } from "@/hooks/useRole";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, UserCog, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Gestao() {
  const { isSuperAdmin, isLoading: isLoadingRole } = useRole();
  const { users, isLoading: isLoadingUsers, addRole, removeRole } = useUserManagement();

  if (isLoadingRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta página. Apenas super administradores podem gerenciar usuários.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Gerencie permissões e acessos do sistema</p>
          </div>
        </div>

        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertTitle>Segurança e Privacidade</AlertTitle>
          <AlertDescription>
            Como super administrador, você tem acesso aos dados administrativos dos psicólogos, mas <strong>nunca</strong> aos dados clínicos dos pacientes. 
            Todos os prontuários e notas de sessão são criptografados com chave pessoal do psicólogo e não podem ser acessados pela gestão.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              Gerencie as permissões de cada usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{user.profile?.name || 'Sem nome'}</h3>
                        <div className="flex gap-2">
                          {user.roles.map(role => (
                            <Badge key={role} variant={role === 'super_admin' ? 'default' : 'secondary'}>
                              {role === 'super_admin' ? 'Super Admin' : 'Psicólogo'}
                            </Badge>
                          ))}
                          {user.roles.length === 0 && (
                            <Badge variant="outline">Sem permissões</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.profile?.crp_number && (
                        <p className="text-sm text-muted-foreground">CRP: {user.profile.crp_number}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!user.roles.includes('psychologist') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addRole({ userId: user.id, role: 'psychologist' })}
                        >
                          Tornar Psicólogo
                        </Button>
                      )}
                      {user.roles.includes('psychologist') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRole({ userId: user.id, role: 'psychologist' })}
                        >
                          Remover Psicólogo
                        </Button>
                      )}
                      
                      {!user.roles.includes('super_admin') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addRole({ userId: user.id, role: 'super_admin' })}
                        >
                          Tornar Admin
                        </Button>
                      )}
                      {user.roles.includes('super_admin') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRole({ userId: user.id, role: 'super_admin' })}
                        >
                          Remover Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
