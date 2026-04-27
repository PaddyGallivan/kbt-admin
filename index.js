// kbt-admin Worker — serves KBT_ADMIN KV files + /api/question endpoint
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    if (pathname === '/api/question') {
      const eventCode = url.searchParams.get('event_code') || '';
      const kvKey = `question:${eventCode}`;
      if (request.method === 'GET') {
        const val = await env.KBT_ADMIN.get(kvKey);
        return new Response(val || JSON.stringify(null), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      if (request.method === 'POST') {
        let body; try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
        const code = body.event_code || eventCode;
        if (!code) return new Response(JSON.stringify({ error: 'event_code required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        await env.KBT_ADMIN.put(`question:${code}`, JSON.stringify(body), { expirationTtl: 7200 });
        return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      if (request.method === 'DELETE') {
        await env.KBT_ADMIN.delete(kvKey);
        return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      return new Response('Method not allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    const rawPath = pathname.replace(/^\//, '') || 'index';
    const kvKey = rawPath.replace(/\.[^.]+$/, '').replace(/\./g, '-') || 'index';
    const ext = rawPath.split('.').pop().toLowerCase();
    let contentType = 'text/html; charset=utf-8';
    if (ext === 'js') contentType = 'application/javascript; charset=utf-8';
    else if (ext === 'json') contentType = 'application/json; charset=utf-8';
    else if (ext === 'css') contentType = 'text/css; charset=utf-8';
    const content = await env.KBT_ADMIN.get(kvKey);
    if (!content) {
      const adminHtml = await env.KBT_ADMIN.get('admin-app');
      if (!adminHtml) return new Response('Not found', { status: 404 });
      return new Response(adminHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
    }
    return new Response(content, { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' } });
  }
};