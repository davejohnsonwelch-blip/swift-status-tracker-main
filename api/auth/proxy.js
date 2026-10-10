export default async (req, res) => {
  try {
    const result = await fetch("https://ep-super-dawn-b5tkweht.neonauth.c-7.us-east-2.aws.neon.te/neondb/auth/get-session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.swiftpaytracker.com",
      },
      redirect: "manual",
    });
    const text = await result.text();
    res.status(200).json({ status: result.status, body: text });
  } catch (error) {
    const cause = error.cause || error;
    res.status(200).json({
      error: error.message,
      type: error.constructor.name,
      cause: cause.message,
      code: cause.code,
    });
  }
};
