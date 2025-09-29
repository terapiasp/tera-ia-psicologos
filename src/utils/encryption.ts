/**
 * Utilitários de criptografia end-to-end para dados sensíveis
 * 
 * IMPORTANTE: A chave de criptografia fica apenas no browser do psicólogo
 * e nunca é enviada ao servidor. Isso garante que nem a gestão tem acesso
 * aos dados clínicos descriptografados.
 */

const ENCRYPTION_KEY_STORAGE = 'tera_encryption_key';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Gera uma nova chave de criptografia
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Exporta uma chave para armazenamento
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

/**
 * Importa uma chave do armazenamento
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const jwk = JSON.parse(keyData);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Salva a chave de criptografia no localStorage
 * NOTA: Em produção, considere usar uma solução mais segura como
 * armazenamento protegido por senha ou hardware security module
 */
export async function saveEncryptionKey(key: CryptoKey): Promise<void> {
  const exported = await exportKey(key);
  localStorage.setItem(ENCRYPTION_KEY_STORAGE, exported);
}

/**
 * Recupera a chave de criptografia do localStorage
 */
export async function getEncryptionKey(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  if (!stored) return null;
  
  try {
    return await importKey(stored);
  } catch (error) {
    console.error('Erro ao recuperar chave de criptografia:', error);
    return null;
  }
}

/**
 * Verifica se existe uma chave de criptografia
 */
export function hasEncryptionKey(): boolean {
  return !!localStorage.getItem(ENCRYPTION_KEY_STORAGE);
}

/**
 * Remove a chave de criptografia (logout/troca de usuário)
 */
export function clearEncryptionKey(): void {
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE);
}

/**
 * Criptografa dados sensíveis
 */
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Gera um IV (Initialization Vector) aleatório
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Criptografa os dados
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    dataBuffer
  );
  
  // Combina IV + dados criptografados
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Converte para base64 para armazenamento
  return btoa(String.fromCharCode(...combined));
}

/**
 * Descriptografa dados sensíveis
 */
export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    // Converte de base64 para buffer
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extrai IV e dados criptografados
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Descriptografa
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // Converte de volta para string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Falha ao descriptografar dados. Chave inválida ou dados corrompidos.');
  }
}

/**
 * Inicializa o sistema de criptografia para um novo usuário
 */
export async function initializeEncryption(): Promise<CryptoKey> {
  const key = await generateEncryptionKey();
  await saveEncryptionKey(key);
  return key;
}
