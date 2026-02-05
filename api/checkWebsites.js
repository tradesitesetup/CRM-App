export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { urls } = req.body; // Expecting an array of URLs
        const results = await Promise.all(urls.map(async (url) => {
            try {
                const response = await fetch(url);
                return { url, status: response.status, ok: response.ok };
            } catch (err) {
                return { url, status: 'error', ok: false };
            }
        }));
        res.status(200).json(results);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
