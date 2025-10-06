import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRC16 (CCITT-FALSE) - Especificação BACEN
function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  crc = crc & 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Normalizar texto removendo acentos
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/gi, '')
    .toUpperCase()
    .trim();
}

// Validar CPF
function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;
  
  return true;
}

// Validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[13])) return false;
  
  return true;
}

// Validar telefone brasileiro
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 13 && cleaned.length !== 11) return false;
  
  const ddd = cleaned.length === 13 ? cleaned.substring(2, 4) : cleaned.substring(0, 2);
  const dddNum = parseInt(ddd);
  
  const invalidRanges = [
    [0, 10], [20, 29], [30, 39], [40, 49], 
    [50, 59], [60, 69], [70, 79], [90, 99]
  ];
  
  for (const [min, max] of invalidRanges) {
    if (dddNum >= min && dddNum <= max) return false;
  }
  
  return dddNum >= 11 && dddNum <= 99;
}

// Gerar BRCode (código PIX)
function gerarBRCode(dados: {
  chavePix: string;
  nome: string;
  cidade: string;
  valor?: number;
  descricao?: string;
}): string {
  const nome = normalizeText(dados.nome).substring(0, 25);
  const cidade = normalizeText(dados.cidade).substring(0, 15);
  const txid = `TERA${Date.now().toString().slice(-10)}`.substring(0, 25);
  
  const chavePix = dados.chavePix;
  const merchantAccount = `0014br.gov.bcb.pix01${chavePix.length.toString().padStart(2, '0')}${chavePix}`;
  
  let payload = [
    "00020101", // Payload Format Indicator
    "021126", // Point of Initiation Method (static)
    `26${merchantAccount.length.toString().padStart(2, '0')}${merchantAccount}`, // Merchant Account Information
    "52040000", // Merchant Category Code (P2P)
    "5303986", // Transaction Currency (BRL)
  ];
  
  // Adicionar valor se fornecido (futuro)
  if (dados.valor && dados.valor > 0) {
    const valorStr = dados.valor.toFixed(2);
    payload.push(`54${valorStr.length.toString().padStart(2, '0')}${valorStr}`);
  }
  
  payload.push(
    "5802BR", // Country Code
    `59${nome.length.toString().padStart(2, '0')}${nome}`, // Merchant Name
    `60${cidade.length.toString().padStart(2, '0')}${cidade}` // Merchant City
  );
  
  // Additional Data Field Template
  const additionalData = `05${txid.length.toString().padStart(2, '0')}${txid}`;
  payload.push(`62${additionalData.length.toString().padStart(2, '0')}${additionalData}`);
  
  const payloadStr = payload.join('');
  const crc = calculateCRC16(payloadStr + "6304");
  
  return payloadStr + "6304" + crc;
}

// Gerar QR Code em base64
async function gerarQRCode(texto: string): Promise<string> {
  const qr = await import("https://esm.sh/qrcode@1.5.3");
  return await qr.toDataURL(texto, {
    errorCorrectionLevel: 'M',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

// Rate limiting
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 5) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ 
        error: "Limite de gerações excedido. Aguarde 1 minuto." 
      }), { 
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { profileId, valor, descricao } = await req.json();

    console.log({
      event: 'generate-pix-start',
      profileId,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("pix_key_value, pix_key_type, name, city, pix_copy_paste, id, user_id")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cidade virá do frontend, mas validar se existe
    const cidade = profile.city;
    if (!profile.pix_key_value || !profile.name || !cidade) {
      return new Response(JSON.stringify({ 
        error: "Dados incompletos. Configure chave PIX, nome e cidade." 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar chave PIX
    const keyType = profile.pix_key_type;
    let isValid = true;
    
    switch (keyType) {
      case 'cpf':
        isValid = validateCPF(profile.pix_key_value);
        break;
      case 'cnpj':
        isValid = validateCNPJ(profile.pix_key_value);
        break;
      case 'telefone':
        isValid = validatePhone(profile.pix_key_value);
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.pix_key_value);
        break;
      case 'random':
        isValid = profile.pix_key_value.length >= 32;
        break;
    }

    if (!isValid) {
      console.log({
        event: 'generate-pix-invalid-key',
        keyType,
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ 
        error: `Chave PIX inválida para tipo ${keyType}` 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar código PIX
    const codigoCopiaCola = gerarBRCode({
      chavePix: profile.pix_key_value,
      nome: profile.name,
      cidade: cidade,
      valor,
      descricao
    });

    // Gerar QR Code
    const qrCodeBase64 = await gerarQRCode(codigoCopiaCola);

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pix_copy_paste: codigoCopiaCola,
        pix_qr_code: qrCodeBase64,
        pix_updated_at: new Date().toISOString()
      })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error({
        event: 'generate-pix-db-error',
        error: updateError,
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log({
      event: 'generate-pix-success',
      profileId,
      keyType,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        codigoCopiaCola,
        qrCodeBase64,
        message: "Código PIX gerado com sucesso"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error({
      event: 'generate-pix-error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
