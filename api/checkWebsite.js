export default async function handler(req, res) {
    const url = req.query.url;

    try {
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
