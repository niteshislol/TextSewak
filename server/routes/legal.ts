import { RequestHandler } from "express";

export const handleLegalAnalyze: RequestHandler = async (req, res) => {
    try {
        const response = await fetch("http://localhost:5000/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText || "Legal Engine Error" });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Legal Analysis Error:", error);
        res.status(500).json({ error: "Failed to connect to Legal Engine. Is it running?" });
    }
};
