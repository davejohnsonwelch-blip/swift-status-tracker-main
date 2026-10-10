const NEON_AUTH_BASE_URL =
  "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

export default async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const authPath = url.searchParams.get("path") || "";
    url.searchParams.delete("path");
    const queryString = url.search;
    const targetUrl = `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;

    const headers = {};
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (
          typeof value === "string" &&
          !["host", "content-length", "connection"].includes(key.toLowerCase())
        ) {
          headers[key] = value;
        }
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

    let response;
    try {
      response = await fetch(targetUrl, {
        method: req.method || "GET",
        headers,
        body: body && body !== "{}" ? body : undefined,
        redirect: "manual",
      });
    } catch (fetchError) {
      console.error("[Fetch error]", {
        targetUrl,
        error: fetchError.message,
        cause: fetchError.cause?.message,
        stack: fetchError.stack,
      });
      res.status(200).json({
        error: "fetch failed",
        targetUrl,
        message: fetchError.message,
        type: fetchError.constructor.name,
      });
      return;
    }

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "transfer-encoding" && key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, value);
      }
    }

    const responseBody = await response.text();
    res.status(response.status).send(responseBody);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(200).json({
      error: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });
  }
};
