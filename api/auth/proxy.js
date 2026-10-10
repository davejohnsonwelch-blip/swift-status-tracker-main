const https = require("https");

const NEON_AUTH_BASE_URL = "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

module.exports = (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const authPath = url.searchParams.get("path") || "";
    url.searchParams.delete("path");
    const queryString = url.search;
    const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

    const parsedTarget = new URL(targetUrl);

    const headers = {};
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string" && !["host", "content-length", "connection"].includes(key.toLowerCase())) {
          headers[key] = value;
        }
      }
    }
    headers["Content-Type"] = req.headers["content-type"] || "application/json";
    headers["Origin"] = req.headers.origin || "https://www.swiftpaytracker.com";
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }
    headers["Host"] = parsedTarget.hostname;

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = chunks.length > 0 ? Buffer.concat(chunks).toString() : undefined;

      const options = {
        hostname: parsedTarget.hostname,
        port: 443,
        path: `${parsedTarget.pathname}${parsedTarget.search}`,
        method: req.method || "GET",
        headers,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (key.toLowerCase() !== "transfer-encoding") {
            res.setHeader(key, value);
          }
        }
        res.writeHead(proxyRes.statusCode || 500);
        proxyRes.pipe(res);
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy error:", err);
        res.status(200).json({ error: err.message });
      });

      if (body) {
        proxyReq.write(body);
      }
      proxyReq.end();
    });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(200).json({ error: error.message });
  }
};
