module.exports = async (req, res) => {
  try {
    const { handleAuthProxyRequest } = await import("@neondatabase/auth/server");

    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/^\/api\/auth\//, "");
    const params = url.searchParams;
    const queryString = params.toString();

    const NEON_AUTH_BASE_URL =
      process.env.NEON_AUTH_BASE_URL ||
      "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

    const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET || "fallback-secret-key-for-dev";

    const response = await handleAuthProxyRequest({
      request: new Request(url, {
        method: req.method,
        headers: req.headers,
      }),
      path,
      baseUrl: NEON_AUTH_BASE_URL,
      cookieSecret,
      sessionDataTtl: 21600,
      domain: "swiftpaytracker.com",
      sameSite: "Lax",
      log: console,
    });

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    }

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(200).json({ error: error.message });
  }
};
