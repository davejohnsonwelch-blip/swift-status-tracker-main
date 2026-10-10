export default async (req, res) => {
  const urls = [
    "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth/get-session",
    "https://ep-super-dawn-b5tkweht.neon.tech/neondb/auth/get-session",
    "https://ep-super-dawn-b5tkweht.api.neon.tech/v1/organizations",
    "https://httpbin.org/get",
    "https://google.com",
  ];

  const results = {};
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: "GET", redirect: "manual" });
      const body = await r.text();
      results[u] = { status: r.status, bodyLen: body.length };
    } catch (e) {
      results[u] = { error: e.message };
    }
  }

  res.status(200).json(results);
};
