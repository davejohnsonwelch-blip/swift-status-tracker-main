export default async (req, res) => {
  try {
    const result = await fetch("https://httpbin.org/get", {
      method: "GET",
    });
    const text = await result.text();
    res.status(200).json({ status: result.status, body: text });
  } catch (error) {
    res.status(200).json({ error: error.message, cause: error.cause?.message });
  }
};
