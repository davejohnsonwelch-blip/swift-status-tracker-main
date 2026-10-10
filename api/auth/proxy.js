module.exports = (req, res) => {
  res.status(200).json({ 
    ok: true, 
    hasFetch: typeof fetch !== "undefined",
    nodeVersion: process.version,
    url: req.url
  });
};
