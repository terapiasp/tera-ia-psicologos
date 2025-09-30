import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { forceRegenerateForPatients } from '@/utils/integrityFix';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function IntegrityCheck() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [affectedPatients, setAffectedPatients] = useState<any[]>([]);

  const checkIntegrity = async () => {
    if (!user?.id) return;
    
    setChecking(true);
    setResults(null);
    
    try {
      // Buscar todos os pacientes ativos com agenda recorrente
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          name,
          is_archived
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (patientsError) throw patientsError;

      console.log('📋 Pacientes ativos encontrados:', patients?.length);

      // Para cada paciente, verificar se tem agenda ativa e sessões futuras
      const problematicPatients = [];
      
      for (const patient of patients || []) {
        // Verificar se tem agenda ativa
        const { data: schedule } = await supabase
          .from('recurring_schedules')
          .select('id, rrule_json')
          .eq('patient_id', patient.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!schedule) continue; // Paciente sem agenda recorrente

        // Verificar se tem sessões futuras
        const { data: futureSessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id')
          .eq('schedule_id', schedule.id)
          .eq('origin', 'recurring')
          .gte('scheduled_at', new Date().toISOString())
          .limit(1);

        if (sessionsError) {
          console.error('Erro ao verificar sessões:', sessionsError);
          continue;
        }

        if (!futureSessions || futureSessions.length === 0) {
          problematicPatients.push({
            ...patient,
            scheduleId: schedule.id,
            rule: schedule.rrule_json
          });
        }
      }

      console.log('❌ Pacientes sem sessões futuras:', problematicPatients.length);
      setAffectedPatients(problematicPatients);
      setResults({
        total: patients?.length || 0,
        affected: problematicPatients.length,
        healthy: (patients?.length || 0) - problematicPatients.length
      });

    } catch (error: any) {
      console.error('Erro ao verificar integridade:', error);
      alert('Erro ao verificar integridade: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const fixIntegrity = async () => {
    if (affectedPatients.length === 0) return;
    
    setFixing(true);
    
    try {
      const patientIds = affectedPatients.map(p => p.id);
      console.log('🔧 Iniciando correção para', patientIds.length, 'pacientes');
      
      const fixResults = await forceRegenerateForPatients(patientIds);
      
      console.log('✅ Correção concluída:', fixResults);
      
      alert(`Correção concluída!\n\n✅ Sucesso: ${fixResults.success.length}\n❌ Falhas: ${fixResults.failed.length}`);
      
      // Reexecutar verificação
      await checkIntegrity();
      
    } catch (error: any) {
      console.error('Erro ao corrigir:', error);
      alert('Erro ao corrigir: ' + error.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Verificação de Integridade
          </CardTitle>
          <CardDescription>
            Verifica e corrige pacientes com agendas recorrentes que perderam suas sessões futuras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={checkIntegrity} 
              disabled={checking || fixing}
              className="gap-2"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Verificar Integridade
                </>
              )}
            </Button>
            
            {affectedPatients.length > 0 && (
              <Button 
                onClick={fixIntegrity} 
                disabled={checking || fixing}
                variant="destructive"
                className="gap-2"
              >
                {fixing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Corrigir Agora ({affectedPatients.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{results.total}</div>
                    <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{results.healthy}</div>
                    <p className="text-sm text-muted-foreground">Saudáveis</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{results.affected}</div>
                    <p className="text-sm text-muted-foreground">Precisam Correção</p>
                  </CardContent>
                </Card>
              </div>

              {affectedPatients.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pacientes Afetados</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      {affectedPatients.map(p => (
                        <div key={p.id} className="text-sm">
                          • {p.name}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {affectedPatients.length === 0 && results.total > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Tudo OK!</AlertTitle>
                  <AlertDescription>
                    Todos os pacientes com agendas recorrentes têm sessões futuras corretamente criadas.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
