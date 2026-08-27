export default {
  async fetch(request, env) {
    // اجازه‌ی درخواست‌های preflight مرورگر (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    // رمز محافظتی از طریق آدرس گرفته می‌شه (نه هدر) — چون این روش با موبایل بهتر جواب داد
    const secret = url.searchParams.get('secret');
    if (!secret || secret !== env.PROXY_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const method = url.searchParams.get('method');
    const bot = url.searchParams.get('bot'); // 'kartjooje' یا 'talfat'
    if (!method || !bot) {
      return new Response('Missing method or bot', { status: 400 });
    }

    // فقط این چندتا کار روی ربات‌ها مجازه - نه هر کاری
    const allowedMethods = ['sendDocument', 'sendMessage', 'editMessageMedia', 'deleteMessage'];
    if (!allowedMethods.includes(method)) {
      return new Response('Method not allowed on bot', { status: 403 });
    }

    const tokens = {
      kartjooje: env.KARTJOOJE_BOT_TOKEN, // ربات بکاپ کارت‌جوجه
      talfat: env.TALFAT_BOT_TOKEN,       // ربات هشدار تلفات
    };
    const token = tokens[bot];
    if (!token) {
      return new Response('Unknown bot', { status: 400 });
    }

    const teleUrl = `https://api.telegram.org/bot${token}/${method}`;
    const contentType = request.headers.get('content-type') || '';
    const resp = await fetch(teleUrl, {
      method: 'POST',
      headers: contentType ? { 'content-type': contentType } : {},
      body: request.body,
      duplex: 'half',
    });

    const respBody = await resp.text();
    return new Response(respBody, {
      status: resp.status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
