interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const characters = [
  {
    id: 'harry-potter',
    name: 'Harry Potter',
    avatarUrl: null,
    house: 'Gryffindor',
    grade: '七年级',
    title: '救世之星',
    description: '勇气、友谊与一点点莽撞。',
    greeting: '需要帮忙吗？霍格沃茨的楼梯今晚看起来有点不安分。',
  },
  {
    id: 'hermione-granger',
    name: 'Hermione Granger',
    avatarUrl: null,
    house: 'Gryffindor',
    grade: '七年级',
    title: '图书馆常驻顾问',
    description: '如果答案存在，它大概率在书里。',
    greeting: '我建议你先整理线索，再决定下一步行动。',
  },
  {
    id: 'draco-malfoy',
    name: 'Draco Malfoy',
    avatarUrl: null,
    house: 'Slytherin',
    grade: '七年级',
    title: '斯莱特林继承人候选',
    description: '骄傲、敏锐，也许比他承认的更复杂。',
    greeting: '别挡路。除非你确实带来了值得听的消息。',
  },
];

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((item) => item.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: unknown, request: Request, env: Env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
    },
  });
}

function fail(message: string, request: Request, env: Env, status = 400) {
  return json({ message }, request, env, status);
}

function base64Url(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

async function sha256(value: string) {
  return base64Url(await crypto.subtle.digest('SHA-256', encodeText(value)));
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encodeText(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64Url(await crypto.subtle.sign('HMAC', key, encodeText(value)));
}

async function signToken(payload: Record<string, unknown>, secret: string, maxAgeSeconds: number) {
  const header = base64Url(encodeText(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64Url(
    encodeText(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds })),
  );
  const signature = await hmac(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

async function verifyToken(token: string, secret: string) {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;
  const expected = await hmac(`${header}.${body}`, secret);
  if (signature !== expected) return null;
  const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function authUser(request: Request, env: Env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload?.sub) return null;
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<any>();
}

async function parseJson(request: Request) {
  try {
    return await request.json<any>();
  } catch {
    return {};
  }
}

async function authPayload(user: any, env: Env) {
  const base = { sub: user.id, email: user.email };
  return {
    accessToken: await signToken(base, env.JWT_SECRET, 60 * 60 * 24 * 7),
    refreshToken: await signToken({ ...base, type: 'refresh' }, env.JWT_SECRET, 60 * 60 * 24 * 30),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name || user.email.split('@')[0],
    },
  };
}

async function getProfile(user: any, env: Env) {
  const profile = await env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(user.id).first<any>();
  const wallet = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first<any>();
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name || user.email.split('@')[0],
    avatarUrl: user.avatar_url,
    profile: {
      nickname: profile?.nickname,
      house: profile?.house,
      houseLocked: Boolean(profile?.house_locked),
      grade: profile?.grade,
      wizardTitle: profile?.wizard_title,
      team: profile?.team,
      bio: profile?.bio,
    },
    wallet: {
      balanceGalleons: wallet?.balance_galleons ?? 0,
    },
  };
}

async function handleAuth(path: string, request: Request, env: Env) {
  const body = await parseJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (path === '/auth/register') {
    if (!email || !password || password.length < 6) {
      return fail('邮箱和至少 6 位密语是必填项。', request, env);
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return fail('这封猫头鹰邮箱已经登记过了。', request, env, 409);

    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await sha256(`${salt}:${password}`);
    const displayName = email.split('@')[0] || '新生巫师';

    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, salt, display_name) VALUES (?, ?, ?, ?, ?)',
      ).bind(id, email, passwordHash, salt, displayName),
      env.DB.prepare('INSERT INTO user_profiles (user_id, nickname) VALUES (?, ?)').bind(id, displayName),
      env.DB.prepare('INSERT INTO wallets (user_id, balance_galleons) VALUES (?, 0)').bind(id),
    ]);

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<any>();
    return json(await authPayload(user, env), request, env);
  }

  if (path === '/auth/login') {
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<any>();
    if (!user) return fail('邮箱或密码错误。', request, env, 401);
    const passwordHash = await sha256(`${user.salt}:${password}`);
    if (passwordHash !== user.password_hash) return fail('邮箱或密码错误。', request, env, 401);
    return json(await authPayload(user, env), request, env);
  }

  if (path === '/auth/refresh') {
    const payload = await verifyToken(String(body.refreshToken || ''), env.JWT_SECRET);
    if (!payload?.sub || payload.type !== 'refresh') return fail('Refresh Token 无效。', request, env, 401);
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<any>();
    if (!user) return fail('用户不存在。', request, env, 401);
    return json(await authPayload(user, env), request, env);
  }

  return fail('Not found', request, env, 404);
}

async function handleChat(path: string, request: Request, env: Env, user: any) {
  if (path === '/characters') return json(characters, request, env);
  if (path === '/chat/affinities') return json([], request, env);
  if (path === '/chat/conversations' && request.method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT * FROM conversations WHERE owner_id = ? ORDER BY created_at DESC',
    ).bind(user.id).all<any>();
    return json(rows.results.map((row) => ({
      id: row.id,
      character: characters.find((item) => item.id === row.character_id) || characters[0],
      lastMessage: null,
      createdAt: row.created_at,
    })), request, env);
  }
  if (path === '/chat/conversations' && request.method === 'POST') {
    const body = await parseJson(request);
    const characterId = String(body.characterId || characters[0].id);
    const existing = await env.DB.prepare(
      'SELECT * FROM conversations WHERE owner_id = ? AND character_id = ?',
    ).bind(user.id, characterId).first<any>();
    if (existing) return json(existing, request, env);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO conversations (id, owner_id, character_id) VALUES (?, ?, ?)',
    ).bind(id, user.id, characterId).run();
    const character = characters.find((item) => item.id === characterId) || characters[0];
    await env.DB.prepare(
      'INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), id, 'character', character.id, character.greeting || '欢迎来到霍格沃茨。').run();
    return json({ id, characterId, createdAt: new Date().toISOString() }, request, env);
  }

  const messagesMatch = path.match(/^\/chat\/conversations\/([^/]+)\/messages$/);
  if (messagesMatch && request.method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    ).bind(messagesMatch[1]).all<any>();
    return json({ messages: rows.results, page: 1, total: rows.results.length }, request, env);
  }
  if (messagesMatch && request.method === 'POST') {
    const body = await parseJson(request);
    const content = String(body.content || '').trim();
    if (!content) return fail('消息不能为空。', request, env);
    const conversation = await env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(messagesMatch[1]).first<any>();
    const character = characters.find((item) => item.id === conversation?.character_id) || characters[0];
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), messagesMatch[1], 'user', user.id, content),
      env.DB.prepare(
        'INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)',
      ).bind(
        crypto.randomUUID(),
        messagesMatch[1],
        'character',
        character.id,
        `我听见了：“${content}”。这条线索已经记入主线日志，下一步我们可以继续调查。`,
      ),
    ]);
    return json({
      reply: {
        id: crypto.randomUUID(),
        senderType: 'character',
        senderId: character.id,
        content: `我听见了：“${content}”。这条线索已经记入主线日志，下一步我们可以继续调查。`,
        createdAt: new Date().toISOString(),
      },
    }, request, env);
  }

  return null;
}

async function handleAuthed(path: string, request: Request, env: Env) {
  const user = await authUser(request, env);
  if (!user) return fail('需要登录。', request, env, 401);

  if (path === '/users/profile' && request.method === 'GET') {
    return json(await getProfile(user, env), request, env);
  }
  if (path === '/users/profile' && request.method === 'PUT') {
    const body = await parseJson(request);
    const displayName = String(body.displayName || body.nickname || user.display_name || '').trim();
    if (displayName) {
      await env.DB.prepare('UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(displayName, user.id)
        .run();
    }
    return json(await getProfile({ ...user, display_name: displayName || user.display_name }, env), request, env);
  }

  const chatResponse = await handleChat(path, request, env, user);
  if (chatResponse) return chatResponse;

  if (path === '/wallet') {
    const wallet = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first<any>();
    return json({ balanceGalleons: wallet?.balance_galleons ?? 0 }, request, env);
  }
  if (path === '/wallet/transactions') return json({ items: [], total: 0 }, request, env);
  if (path === '/wallet/signin/check') return json({ signed: false }, request, env);
  if (path === '/wallet/signin' && request.method === 'POST') return json({ reward: 0 }, request, env);
  if (path === '/shop/shops') return json([], request, env);
  if (path.includes('/products')) return json([], request, env);
  if (path === '/inventory') return json([], request, env);
  if (path === '/posts') return json({ items: [], total: 0 }, request, env);
  if (path === '/tasks/daily') return json([], request, env);
  if (path === '/house-cup') return json([], request, env);
  if (path === '/house-cup/logs') return json([], request, env);
  if (path === '/room') return json({ unlockedRoutes: [], progress: {} }, request, env);
  if (path === '/pets') return json([], request, env);

  return json({ ok: true }, request, env);
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api')) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;

      const spaUrl = new URL(request.url);
      spaUrl.pathname = '/';
      return env.ASSETS.fetch(new Request(spaUrl, request));
    }

    if (!env.DB) {
      return fail('Cloudflare D1 database binding is missing.', request, env, 503);
    }

    const path = url.pathname.replace(/^\/api/, '') || '/';

    if (path.startsWith('/auth/')) {
      return handleAuth(path, request, env);
    }

    return handleAuthed(path, request, env);
  },
};
