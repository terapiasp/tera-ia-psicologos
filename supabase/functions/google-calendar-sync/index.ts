import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  patient_name: string;
  notes?: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Get user profile with Google tokens
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected, google_calendar_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.google_calendar_connected) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token needs refresh
    let accessToken = profile.google_access_token;
    const tokenExpiresAt = new Date(profile.google_token_expires_at);
    const now = new Date();

    if (tokenExpiresAt <= now && profile.google_refresh_token) {
      console.log('Refreshing Google access token for user:', user.id);
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!,
          refresh_token: profile.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();

      if (refreshData.error) {
        console.error('Token refresh error:', refreshData);
        throw new Error('Failed to refresh Google token');
      }

      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

      // Update tokens in database
      await supabaseClient
        .from('profiles')
        .update({
          google_access_token: accessToken,
          google_token_expires_at: newExpiresAt,
        })
        .eq('user_id', user.id);

      console.log('Token refreshed successfully for user:', user.id);
    }

    if (req.method === 'POST') {
      const { sessionData, action }: { sessionData: SessionData; action: 'create' | 'update' | 'delete' } = await req.json();

      if (action === 'delete') {
        // Delete event from Google Calendar
        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${profile.google_calendar_id}/events/${sessionData.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          const errorData = await deleteResponse.text();
          console.error('Google Calendar delete error:', errorData);
          throw new Error('Failed to delete event from Google Calendar');
        }

        console.log('Event deleted from Google Calendar:', sessionData.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create or update event
      const startTime = new Date(sessionData.scheduled_at);
      const endTime = new Date(startTime.getTime() + (sessionData.duration_minutes * 60 * 1000));

      const eventData = {
        summary: `Sessão - ${sessionData.patient_name}`,
        description: sessionData.notes || '',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        status: sessionData.status === 'cancelled' ? 'cancelled' : 'confirmed',
      };

      let response;
      
      if (action === 'create') {
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${profile.google_calendar_id}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else {
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${profile.google_calendar_id}/events/${sessionData.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Google Calendar API error:', errorData);
        throw new Error('Failed to sync with Google Calendar');
      }

      const eventResult = await response.json();
      console.log(`Event ${action}d in Google Calendar:`, eventResult.id);

      return new Response(JSON.stringify({ success: true, eventId: eventResult.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error in google-calendar-sync function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});