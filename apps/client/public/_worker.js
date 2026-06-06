// apps/api/src/index.ts
var characters = [
  {
    id: "harry-potter",
    name: "Harry Potter",
    avatarUrl: null,
    house: "Gryffindor",
    grade: "\u4E03\u5E74\u7EA7",
    title: "\u6551\u4E16\u4E4B\u661F",
    description: "\u52C7\u6C14\u3001\u53CB\u8C0A\u4E0E\u4E00\u70B9\u70B9\u83BD\u649E\u3002",
    greeting: "\u9700\u8981\u5E2E\u5FD9\u5417\uFF1F\u970D\u683C\u6C83\u8328\u7684\u697C\u68AF\u4ECA\u665A\u770B\u8D77\u6765\u6709\u70B9\u4E0D\u5B89\u5206\u3002"
  },
  {
    id: "hermione-granger",
    name: "Hermione Granger",
    avatarUrl: null,
    house: "Gryffindor",
    grade: "\u4E03\u5E74\u7EA7",
    title: "\u56FE\u4E66\u9986\u5E38\u9A7B\u987E\u95EE",
    description: "\u5982\u679C\u7B54\u6848\u5B58\u5728\uFF0C\u5B83\u5927\u6982\u7387\u5728\u4E66\u91CC\u3002",
    greeting: "\u6211\u5EFA\u8BAE\u4F60\u5148\u6574\u7406\u7EBF\u7D22\uFF0C\u518D\u51B3\u5B9A\u4E0B\u4E00\u6B65\u884C\u52A8\u3002"
  },
  {
    id: "draco-malfoy",
    name: "Draco Malfoy",
    avatarUrl: null,
    house: "Slytherin",
    grade: "\u4E03\u5E74\u7EA7",
    title: "\u65AF\u83B1\u7279\u6797\u7EE7\u627F\u4EBA\u5019\u9009",
    description: "\u9A84\u50B2\u3001\u654F\u9510\uFF0C\u4E5F\u8BB8\u6BD4\u4ED6\u627F\u8BA4\u7684\u66F4\u590D\u6742\u3002",
    greeting: "\u522B\u6321\u8DEF\u3002\u9664\u975E\u4F60\u786E\u5B9E\u5E26\u6765\u4E86\u503C\u5F97\u542C\u7684\u6D88\u606F\u3002"
  }
];
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
function json(data, request, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env)
    }
  });
}
function fail(message, request, env, status = 400) {
  return json({ message }, request, env, status);
}
function base64Url(bytes) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function encodeText(value) {
  return new TextEncoder().encode(value);
}
async function sha256(value) {
  return base64Url(await crypto.subtle.digest("SHA-256", encodeText(value)));
}
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeText(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64Url(await crypto.subtle.sign("HMAC", key, encodeText(value)));
}
async function signToken(payload, secret, maxAgeSeconds) {
  const header = base64Url(encodeText(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64Url(
    encodeText(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1e3) + maxAgeSeconds }))
  );
  const signature = await hmac(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}
async function verifyToken(token, secret) {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;
  const expected = await hmac(`${header}.${body}`, secret);
  if (signature !== expected) return null;
  const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) return null;
  return payload;
}
async function authUser(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload?.sub) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first();
}
async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
async function authPayload(user, env) {
  const base = { sub: user.id, email: user.email };
  return {
    accessToken: await signToken(base, env.JWT_SECRET, 60 * 60 * 24 * 7),
    refreshToken: await signToken({ ...base, type: "refresh" }, env.JWT_SECRET, 60 * 60 * 24 * 30),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name || user.email.split("@")[0]
    }
  };
}
async function getProfile(user, env) {
  const profile = await env.DB.prepare("SELECT * FROM user_profiles WHERE user_id = ?").bind(user.id).first();
  const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.id).first();
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name || user.email.split("@")[0],
    avatarUrl: user.avatar_url,
    profile: {
      nickname: profile?.nickname,
      house: profile?.house,
      houseLocked: Boolean(profile?.house_locked),
      grade: profile?.grade,
      wizardTitle: profile?.wizard_title,
      team: profile?.team,
      bio: profile?.bio
    },
    wallet: {
      balanceGalleons: wallet?.balance_galleons ?? 0
    }
  };
}
async function handleAuth(path, request, env) {
  const body = await parseJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (path === "/auth/register") {
    if (!email || !password || password.length < 6) {
      return fail("\u90AE\u7BB1\u548C\u81F3\u5C11 6 \u4F4D\u5BC6\u8BED\u662F\u5FC5\u586B\u9879\u3002", request, env);
    }
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return fail("\u8FD9\u5C01\u732B\u5934\u9E70\u90AE\u7BB1\u5DF2\u7ECF\u767B\u8BB0\u8FC7\u4E86\u3002", request, env, 409);
    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await sha256(`${salt}:${password}`);
    const displayName = email.split("@")[0] || "\u65B0\u751F\u5DEB\u5E08";
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO users (id, email, password_hash, salt, display_name) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, email, passwordHash, salt, displayName),
      env.DB.prepare("INSERT INTO user_profiles (user_id, nickname) VALUES (?, ?)").bind(id, displayName),
      env.DB.prepare("INSERT INTO wallets (user_id, balance_galleons) VALUES (?, 0)").bind(id)
    ]);
    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    return json(await authPayload(user, env), request, env);
  }
  if (path === "/auth/login") {
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user) return fail("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF\u3002", request, env, 401);
    const passwordHash = await sha256(`${user.salt}:${password}`);
    if (passwordHash !== user.password_hash) return fail("\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF\u3002", request, env, 401);
    return json(await authPayload(user, env), request, env);
  }
  if (path === "/auth/refresh") {
    const payload = await verifyToken(String(body.refreshToken || ""), env.JWT_SECRET);
    if (!payload?.sub || payload.type !== "refresh") return fail("Refresh Token \u65E0\u6548\u3002", request, env, 401);
    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first();
    if (!user) return fail("\u7528\u6237\u4E0D\u5B58\u5728\u3002", request, env, 401);
    return json(await authPayload(user, env), request, env);
  }
  return fail("Not found", request, env, 404);
}
async function handleChat(path, request, env, user) {
  if (path === "/characters") return json(characters, request, env);
  if (path === "/chat/affinities") return json([], request, env);
  if (path === "/chat/conversations" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM conversations WHERE owner_id = ? ORDER BY created_at DESC"
    ).bind(user.id).all();
    return json(rows.results.map((row) => ({
      id: row.id,
      character: characters.find((item) => item.id === row.character_id) || characters[0],
      lastMessage: null,
      createdAt: row.created_at
    })), request, env);
  }
  if (path === "/chat/conversations" && request.method === "POST") {
    const body = await parseJson(request);
    const characterId = String(body.characterId || characters[0].id);
    const existing = await env.DB.prepare(
      "SELECT * FROM conversations WHERE owner_id = ? AND character_id = ?"
    ).bind(user.id, characterId).first();
    if (existing) return json(existing, request, env);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO conversations (id, owner_id, character_id) VALUES (?, ?, ?)"
    ).bind(id, user.id, characterId).run();
    const character = characters.find((item) => item.id === characterId) || characters[0];
    await env.DB.prepare(
      "INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), id, "character", character.id, character.greeting || "\u6B22\u8FCE\u6765\u5230\u970D\u683C\u6C83\u8328\u3002").run();
    return json({ id, characterId, createdAt: (/* @__PURE__ */ new Date()).toISOString() }, request, env);
  }
  const messagesMatch = path.match(/^\/chat\/conversations\/([^/]+)\/messages$/);
  if (messagesMatch && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    ).bind(messagesMatch[1]).all();
    return json({ messages: rows.results, page: 1, total: rows.results.length }, request, env);
  }
  if (messagesMatch && request.method === "POST") {
    const body = await parseJson(request);
    const content = String(body.content || "").trim();
    if (!content) return fail("\u6D88\u606F\u4E0D\u80FD\u4E3A\u7A7A\u3002", request, env);
    const conversation = await env.DB.prepare("SELECT * FROM conversations WHERE id = ?").bind(messagesMatch[1]).first();
    const character = characters.find((item) => item.id === conversation?.character_id) || characters[0];
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), messagesMatch[1], "user", user.id, content),
      env.DB.prepare(
        "INSERT INTO messages (id, conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        crypto.randomUUID(),
        messagesMatch[1],
        "character",
        character.id,
        `\u6211\u542C\u89C1\u4E86\uFF1A\u201C${content}\u201D\u3002\u8FD9\u6761\u7EBF\u7D22\u5DF2\u7ECF\u8BB0\u5165\u4E3B\u7EBF\u65E5\u5FD7\uFF0C\u4E0B\u4E00\u6B65\u6211\u4EEC\u53EF\u4EE5\u7EE7\u7EED\u8C03\u67E5\u3002`
      )
    ]);
    return json({
      reply: {
        id: crypto.randomUUID(),
        senderType: "character",
        senderId: character.id,
        content: `\u6211\u542C\u89C1\u4E86\uFF1A\u201C${content}\u201D\u3002\u8FD9\u6761\u7EBF\u7D22\u5DF2\u7ECF\u8BB0\u5165\u4E3B\u7EBF\u65E5\u5FD7\uFF0C\u4E0B\u4E00\u6B65\u6211\u4EEC\u53EF\u4EE5\u7EE7\u7EED\u8C03\u67E5\u3002`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }, request, env);
  }
  return null;
}
async function handleAuthed(path, request, env) {
  const user = await authUser(request, env);
  if (!user) return fail("\u9700\u8981\u767B\u5F55\u3002", request, env, 401);
  if (path === "/users/profile" && request.method === "GET") {
    return json(await getProfile(user, env), request, env);
  }
  if (path === "/users/profile" && request.method === "PUT") {
    const body = await parseJson(request);
    const displayName = String(body.displayName || body.nickname || user.display_name || "").trim();
    if (displayName) {
      await env.DB.prepare("UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(displayName, user.id).run();
    }
    return json(await getProfile({ ...user, display_name: displayName || user.display_name }, env), request, env);
  }
  const chatResponse = await handleChat(path, request, env, user);
  if (chatResponse) return chatResponse;
  if (path === "/wallet") {
    const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.id).first();
    return json({ balanceGalleons: wallet?.balance_galleons ?? 0 }, request, env);
  }
  if (path === "/wallet/transactions") return json({ items: [], total: 0 }, request, env);
  if (path === "/wallet/signin/check") return json({ signed: false }, request, env);
  if (path === "/wallet/signin" && request.method === "POST") return json({ reward: 0 }, request, env);
  if (path === "/shop/shops") return json([], request, env);
  if (path.includes("/products")) return json([], request, env);
  if (path === "/inventory") return json([], request, env);
  if (path === "/posts") return json({ items: [], total: 0 }, request, env);
  if (path === "/tasks/daily") return json([], request, env);
  if (path === "/house-cup") return json([], request, env);
  if (path === "/house-cup/logs") return json([], request, env);
  if (path === "/room") return json({ unlockedRoutes: [], progress: {} }, request, env);
  if (path === "/pets") return json([], request, env);
  return json({ ok: true }, request, env);
}
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api")) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
      const spaUrl = new URL(request.url);
      spaUrl.pathname = "/";
      return env.ASSETS.fetch(new Request(spaUrl, request));
    }
    if (!env.DB) {
      return fail("Cloudflare D1 database binding is missing.", request, env, 503);
    }
    const path = url.pathname.replace(/^\/api/, "") || "/";
    if (path.startsWith("/auth/")) {
      return handleAuth(path, request, env);
    }
    return handleAuthed(path, request, env);
  }
};
export {
  src_default as default
};
