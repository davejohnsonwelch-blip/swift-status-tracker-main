const NEON_AUTH_BASE_URL =
  "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth";

function buildTargetUrl(authPath, queryString) {
  if (authPath.startsWith("neondb/auth/")) {
    authPath = authPath.substring("neondb/auth/".length);
  } else if (authPath.startsWith("neondb/auth")) {
    authPath = authPath.substring("neondb/auth".length);
  }
  return `${NEON_AUTH_BASE_URL}/${authPath}${queryString}`;
}

export default async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const authPath = url.searchParams.get("path") || "";
    url.searchParams.delete("path");
    const queryString = url.search;
    const targetUrl = buildTargetUrl(authPath, queryString);

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
        message: fetchError.message,
        cause: fetchError.cause?.message,
      });
      res.status(200).json({
        error: "fetch failed",
        targetUrl,
        message: fetchError.message,
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
    });
  }
};
