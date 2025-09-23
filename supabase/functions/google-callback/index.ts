import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This is the user ID
    const error = url.searchParams.get('error');

    if (error) {
      console.log('OAuth error:', error);
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Erro na Autorização</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>Erro na autorização</h1>
            <p>Ocorreu um erro ao conectar com o Google Calendar. Você pode fechar esta janela.</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Exchange code for tokens
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error);
    }

    console.log('Token exchange successful for user:', state);

    // Get primary calendar ID
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const calendarData = await calendarResponse.json();
    
    if (calendarData.error) {
      console.error('Calendar fetch error:', calendarData);
      throw new Error(calendarData.error.message || 'Failed to fetch calendar');
    }

    console.log('Calendar data fetched for user:', state);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Update user profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        google_access_token: tokenData.access_token,
        google_refresh_token: tokenData.refresh_token,
        google_token_expires_at: expiresAt,
        google_calendar_connected: true,
        google_calendar_id: calendarData.id,
      })
      .eq('user_id', state);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Profile updated successfully for user:', state);

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autorização Concluída</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .success {
              color: #059669;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Autorização concluída!</div>
            <p>Google Calendar conectado com sucesso!</p>
            <p><small>Você pode fechar esta janela e voltar para o aplicativo.</small></p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in google-callback function:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro na Autorização</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Erro na autorização</h1>
          <p>Erro: ${error.message}</p>
          <p>Você pode fechar esta janela e tentar novamente.</p>
          <script>window.close();</script>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});