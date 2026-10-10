import type { VercelRequest, VercelResponse } from "@vercel/node";

const NEON_AUTH_BASE_URL =
  process.env.NEON_AUTH_BASE_URL ||
  "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const authPath = Array.isArray(path) ? path.join("/") : path || "";
  const queryString = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers["content-type"] || "application/json",
    Origin: req.headers.origin || "https://www.swiftpaytracker.com",
  };

  if (req.headers.cookie) {
    headers.Cookie = req.headers.cookie;
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    headers["Content-Type"] = req.headers["content-type"] || "application/json";
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
  } catch (error: any) {
    console.error("Proxy error:", error);
    res.status(502).json({ error: "Proxy error", message: error.message });
  }
}
