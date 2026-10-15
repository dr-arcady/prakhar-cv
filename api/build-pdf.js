const { generatePDF } = require('../generate-pdf');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.GITHUB_PAT;
    const repo = "dr-arcady/prakhar-cv"; // Your GitHub repository name

    if (!token) {
        return res.status(500).json({ error: 'GitHub PAT environment variable is not configured on Vercel.' });
    }

    try {
        // Trigger GitHub Actions workflow_dispatch for deploy.yml
        const url = `https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Portfolio-PDF-Trigger'
            },
            body: JSON.stringify({ ref: 'main' })
        });

        if (response.status === 204 || response.ok) {
            return res.status(200).json({ success: true, message: 'Workflow triggered successfully!' });
        } else {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to trigger GitHub workflow');
        }
    } catch (err) {
        console.error("PDF Trigger Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
