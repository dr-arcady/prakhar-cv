const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Load print-cv.html locally via file path
    const filePath = 'file://' + path.resolve(__dirname, 'print-cv.html');
    console.log(`Loading print template from ${filePath}...`);
    
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    // Wait an extra moment for portfolio-data.json to fetch and render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdfPath = path.resolve(__dirname, 'Prakhar Srivastava - CV.pdf');
    console.log(`Generating PDF to ${pdfPath}...`);

    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm'
        }
    });

    await browser.close();
    console.log('PDF generated successfully!');
}

generatePDF().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
