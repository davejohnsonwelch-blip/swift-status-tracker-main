module.exports = (req, res) => {
  res.status(200).json({ ok: true, method: req.method, url: req.url });
};
