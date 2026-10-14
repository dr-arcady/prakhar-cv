const { generatePDF } = require('../generate-pdf');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        console.log('API trigger: Building PDF on demand...');
        await generatePDF();
        return res.status(200).json({ success: true, message: 'PDF generated successfully!' });
    } catch (err) {
        console.error('Error in build-pdf API:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
