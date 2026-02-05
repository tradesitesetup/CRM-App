import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: "error", message: "No URL provided" });

  try {
    // Try HEAD request first to minimize data
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      res.status(200).json({ status: "up" });
    } else {
      res.status(200).json({ status: "down" });
    }
  } catch (err) {
    res.status(200).json({ status: "down" });
  }
}
