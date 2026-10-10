module.exports = async (req, res) => {
  const NEON_AUTH_BASE_URL = "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

  const url = new URL(req.url, "http://localhost");
  const authPath = url.searchParams.get("path") || "";
  url.searchParams.delete("path");
  const queryString = url.search;
  const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

  const headers = {
    "Content-Type": req.headers["content-type"] || "application/json",
    Origin: req.headers.origin || "https://www.swiftpaytracker.com",
  };

  if (req.headers.cookie) {
    headers.Cookie = req.headers.cookie;
  }

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString();
    if (!body || body === "{}") body = undefined;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    }

    const responseBody = await response.text();
    res.status(response.status);
    res.send(responseBody);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(502).json({ error: "Proxy error", message: error.message });
  }
};
