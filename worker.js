const SB_URL = 'https://hrjgokonpyunhxlpbhqv.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyamdva29ucHl1bmh4bHBiaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTM2MzUsImV4cCI6MjA5Mzk4OTYzNX0.vvy9g2kbYEFkNYHwWgi-xf3xQBeMYVcZOYRKGjMFUl8';

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, Prefer',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname + url.search;

    // Forward request to Supabase
    const sbUrl = SB_URL + path;

    const headers = new Headers(request.headers);
    headers.set('apikey', SB_KEY);
    headers.set('Authorization', 'Bearer ' + SB_KEY);

    try {
      const response = await fetch(sbUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' ? request.body : undefined,
      });

      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
