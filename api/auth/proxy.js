const https = require("https");

const NEON_AUTH_BASE_URL =
  "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
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
    headers["Host"] = parsedTarget.hostname;
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedTarget.hostname,
        port: 443,
        path: `${parsedTarget.pathname}${parsedTarget.search}`,
        method: req.method || "GET",
        headers,
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

      if (body && body !== "{}") {
        proxyReq.write(body);
      }
      proxyReq.end();
    });

    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
    res.status(result.status).send(result.body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(200).json({ error: error.message });
  }
};
