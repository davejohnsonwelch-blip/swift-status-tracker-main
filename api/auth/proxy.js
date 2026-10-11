async function readRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString();
  return raw || undefined;
}

async function handler(req, res) {
  try {
    const { handleAuthProxyRequest } = await import("@neondatabase/auth/server");

    const url = new URL(req.url || "/", "http://localhost");
    const path = url.searchParams.get("path") || "";
    url.searchParams.delete("path");

    // Bypass the proxy's session cookie cache so get-session always hits the
    // upstream Neon auth server. Only the upstream response carries the
    // `set-auth-jwt` header that the SPA needs to authorize Data API requests.
    if (path === "get-session") {
      url.searchParams.set("disableCookieCache", "true");
    }

    const NEON_AUTH_BASE_URL =
      process.env.NEON_AUTH_BASE_URL ||
      "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";

    const cookieSecret =
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "fallback-secret-key-for-dev-only";

    const headers = {};
    for (const [key, value] of Object.entries(req.headers || {})) {
      const name = key.toLowerCase();
      if (name === "content-length" || name === "transfer-encoding") continue;
      if (value === undefined) continue;
      headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    const fetchRequest = new Request(url, {
      method: req.method,
      headers,
      body: await readRequestBody(req),
    });

    const response = await handleAuthProxyRequest({
      request: fetchRequest,
      path,
      baseUrl: NEON_AUTH_BASE_URL,
      cookieSecret,
      sessionDataTtl: 21600,
      domain: "swiftpaytracker.com",
      sameSite: "Lax",
      log: console,
    });

    const collectedCookies = [];
    for (const [key, value] of response.headers.entries()) {
      const name = key.toLowerCase();
      if (name === "transfer-encoding") continue;
      if (name === "set-cookie") {
        collectedCookies.push(value);
        continue;
      }
      res.setHeader(key, value);
    }

    let setCookies = collectedCookies;
    if (typeof response.headers.getSetCookie === "function") {
      const viaGetter = response.headers.getSetCookie();
      if (viaGetter.length > 0) setCookies = viaGetter;
    }
    if (setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies);
    }

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;
