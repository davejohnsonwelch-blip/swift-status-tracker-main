export default async (req, res) => {
  const urls = [
    "https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth/get-session",
    "https://ep-super-dawn-b5tkweht.neon.tech/neondb/auth/get-session",
    "https://ep-super-dawn-b5tkweht.neon.tech/",
    "https://google.com",
  ];

  const results = {};
  for (const u of urls) {
    try {
      const r = await fetch(u, {
        method: "GET",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://www.swiftpaytracker.com",
        },
      });
      results[u] = { status: r.status, ok: r.ok };
    } catch (e) {
      results[u] = { error: e.message };
    }
  }

  res.status(200).json(results);
};
