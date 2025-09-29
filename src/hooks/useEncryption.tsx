import { useState, useEffect, useCallback } from 'react';
import {
  getEncryptionKey,
  hasEncryptionKey,
  initializeEncryption,
  clearEncryptionKey,
  encryptData,
  decryptData,
} from '@/utils/encryption';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export const useEncryption = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega ou inicializa a chave ao fazer login
  useEffect(() => {
    const loadKey = async () => {
      if (!user) {
        clearEncryptionKey();
        setEncryptionKey(null);
        setIsInitialized(false);
        setIsLoading(false);
        return;
      }

      try {
        if (hasEncryptionKey()) {
          const key = await getEncryptionKey();
          setEncryptionKey(key);
          setIsInitialized(true);
        } else {
          // Primeiro login: inicializar criptografia
          const key = await initializeEncryption();
          setEncryptionKey(key);
          setIsInitialized(true);
          
          toast({
            title: "Criptografia Ativada",
            description: "Seus dados clínicos estão protegidos com criptografia end-to-end.",
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar criptografia:', error);
        toast({
          title: "Erro de Segurança",
          description: "Não foi possível inicializar a criptografia. Entre em contato com o suporte.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadKey();
  }, [user, toast]);

  // Função para criptografar
  const encrypt = useCallback(
    async (data: string): Promise<string | null> => {
      if (!encryptionKey) {
        console.error('Chave de criptografia não disponível');
        return null;
      }

      try {
        return await encryptData(data, encryptionKey);
      } catch (error) {
        console.error('Erro ao criptografar:', error);
        toast({
          title: "Erro",
          description: "Falha ao criptografar dados.",
          variant: "destructive",
        });
        return null;
      }
    },
    [encryptionKey, toast]
  );

  // Função para descriptografar
  const decrypt = useCallback(
    async (encryptedData: string): Promise<string | null> => {
      if (!encryptionKey) {
        console.error('Chave de criptografia não disponível');
        return null;
      }

      try {
        return await decryptData(encryptedData, encryptionKey);
      } catch (error) {
        console.error('Erro ao descriptografar:', error);
        toast({
          title: "Erro",
          description: "Falha ao descriptografar dados. Os dados podem estar corrompidos.",
          variant: "destructive",
        });
        return null;
      }
    },
    [encryptionKey, toast]
  );

  return {
    encrypt,
    decrypt,
    isInitialized,
    isLoading,
    hasKey: !!encryptionKey,
  };
};
