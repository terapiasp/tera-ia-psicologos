import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para calcular CRC16-CCITT
function calcularCRC16(payload: string): string {
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

// Função auxiliar para formatar campo EMV
function formatarCampo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

// Gerar BRCode conforme padrão BACEN
function gerarBRCode(dados: {
  chavePix: string;
  nome: string;
  cidade: string;
}): string {
  // Normalizar nome e cidade (remover acentos, uppercase, limitar caracteres)
  const nome = dados.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .substring(0, 25);
    
  const cidade = dados.cidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .substring(0, 15);

  // Construir Merchant Account Information (campo 26)
  const gui = formatarCampo('00', 'br.gov.bcb.pix');
  const chave = formatarCampo('01', dados.chavePix);
  const merchantAccount = formatarCampo('26', gui + chave);

  // Construir payload sem CRC
  let payload = '';
  payload += formatarCampo('00', '01'); // Payload Format Indicator
  payload += formatarCampo('01', '12'); // Point of Initiation Method (12 = estático reutilizável)
  payload += merchantAccount; // Merchant Account Information
  payload += formatarCampo('52', '0000'); // Merchant Category Code
  payload += formatarCampo('53', '986'); // Transaction Currency (986 = BRL)
  // Não incluir valor (campo 54) para PIX estático reutilizável
  payload += formatarCampo('58', 'BR'); // Country Code
  payload += formatarCampo('59', nome); // Merchant Name
  payload += formatarCampo('60', cidade); // Merchant City
  payload += '6304'; // CRC placeholder

  // Calcular e adicionar CRC
  const crc = calcularCRC16(payload);
  payload = payload.slice(0, -4) + crc;

  return payload;
}

// Gerar QR Code base64
async function gerarQRCode(texto: string): Promise<string> {
  return await QRCode.toDataURL(texto, {
    errorCorrectionLevel: 'M',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();
    
    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId é obrigatório" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Buscar dados do psicólogo
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("pix_key_value, name, city")
      .eq("id", profileId)
      .single();
    
    if (error || !profile) {
      console.error("Erro ao buscar profile:", error);
      return new Response(
        JSON.stringify({ error: "Psicólogo não encontrado" }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!profile.pix_key_value || !profile.name) {
      return new Response(
        JSON.stringify({ error: "Chave PIX e nome são obrigatórios" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Usar cidade padrão se não fornecida
    const cidade = profile.city || 'SAO PAULO';
    
    // Gerar código PIX (BRCode)
    const codigoCopiaCola = gerarBRCode({
      chavePix: profile.pix_key_value,
      nome: profile.name,
      cidade: cidade
    });
    
    console.log("Código PIX gerado:", codigoCopiaCola);
    
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
      .eq("id", profileId);
    
    if (updateError) {
      console.error("Erro ao atualizar profile:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        codigoCopiaCola,
        qrCodeBase64
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
