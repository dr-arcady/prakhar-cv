export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.GITHUB_PAT;
    const repo = "dr-arcady/prakhar-cv"; // Replace with your actual username/repo name if different
    const path = 'portfolio-data.json';

    if (!token) {
        return res.status(500).json({ error: 'GitHub PAT environment variable is not configured on Vercel.' });
    }

    try {
        const portfolioData = req.body;
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;

        // 1. Get current file SHA from GitHub
        const getRes = await fetch(url, {
            headers: { 'Authorization': `token ${token}`, 'User-Agent': 'Portfolio-CMS' }
        });
        
        let sha = '';
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        // 2. Encode updated JSON data to Base64
        const updatedContent = JSON.stringify(portfolioData, null, 2);
        const encodedContent = Buffer.from(updatedContent).toString('base64');

        // 3. Commit update to GitHub via REST API
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Portfolio-CMS'
            },
            body: JSON.stringify({
                message: 'Update portfolio data via serverless admin CMS',
                content: encodedContent,
                sha: sha
            })
        });

        if (putRes.ok) {
            return res.status(200).json({ success: true, message: 'Successfully synced & deployed!' });
        } else {
            const errData = await putRes.json();
            throw new Error(errData.message || 'Failed to commit to GitHub API');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
