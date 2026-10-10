const https = require("https");

const NEON_AUTH_BASE_URL = "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

function proxyRequest(targetUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: method || "GET",
      headers: { ...headers, Host: parsedUrl.hostname },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      const responseHeaders = {};
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (key.toLowerCase() !== "transfer-encoding") {
          responseHeaders[key] = value;
        }
      }

      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        resolve({
          status: proxyRes.statusCode || 500,
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString(),
        });
      });
    });

    proxyReq.on("error", reject);

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const authPath = url.searchParams.get("path") || "";
    url.searchParams.delete("path");
    const queryString = url.search;
    const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

    const headers = {};
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string" && !["host", "content-length", "connection"].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      }
    }
    headers["Content-Type"] = (req.headers && req.headers["content-type"]) || "application/json";

    let body;
    if (req.method !== "GET" && req.method !== "HEAD" && typeof req.read === "function") {
      body = req.read();
      if (body && Buffer.isBuffer(body)) {
        body = body.toString();
      }
    }

    const result = await proxyRequest(targetUrl, req.method || "GET", headers, body);

    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
    res.status(result.status).send(result.body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(200).json({ error: error.message });
  }
};
