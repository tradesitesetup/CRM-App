import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { urls } = req.body;
    const results = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
        results.push({ url, status: response.ok ? 'UP' : 'DOWN' });
      } catch (err) {
        results.push({ url, status: 'DOWN' });
      }
    }

    res.status(200).json(results);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
