const https = require("https");
const http = require("http");

const NEON_AUTH_BASE_URL = "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const authPath = url.searchParams.get("path") || "";
    url.searchParams.delete("path");
    const queryString = url.search;
    const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!["host", "content-length", "connection"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    }
    headers["Content-Type"] = req.headers["content-type"] || "application/json";
    headers["Origin"] = req.headers.origin || "https://www.swiftpaytracker.com";

    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString();
    }

    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: req.method,
      headers,
      rejectUnauthorized: false,
    };

    const client = parsedUrl.protocol === "https:" ? https : http;

    const proxyReq = client.request(options, (proxyRes) => {
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (key.toLowerCase() !== "transfer-encoding") {
          res.setHeader(key, value);
        }
      }
      res.status(proxyRes.statusCode || 500);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("Proxy request error:", err);
      res.status(500).json({ error: "Proxy request failed", message: err.message });
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "Handler failed", message: error.message, stack: error.stack });
  }
};
