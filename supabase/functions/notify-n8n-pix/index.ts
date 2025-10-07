import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PixPaymentPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  schema: string
  old_record: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload: PixPaymentPayload = await req.json()
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

    // Verificar se é um INSERT na tabela pix_payments
    if (payload.type !== 'INSERT' || payload.table !== 'pix_payments') {
      console.log('Ignoring non-INSERT event or wrong table')
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pixPayment = payload.record
    console.log('Processing PIX payment:', pixPayment.id)

    // Chamar o N8N webhook
    const n8nUrl = 'https://n8n.srv1001619.hstgr.cloud/webhook-test/be8c0e22-efd3-4a8e-901d-50ff09fb8caf'
    
    console.log('Calling N8N webhook:', n8nUrl)
    
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'pix_payment_created',
        data: pixPayment,
        timestamp: new Date().toISOString()
      })
    })

    const n8nResponseText = await n8nResponse.text()
    console.log('N8N response status:', n8nResponse.status)
    console.log('N8N response body:', n8nResponseText)

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} - ${n8nResponseText}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'N8N notified successfully',
        n8nResponse: n8nResponseText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in notify-n8n-pix:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
