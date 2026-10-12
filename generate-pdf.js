const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
    console.log('Reading portfolio data...');
    const dataPath = path.resolve(__dirname, 'portfolio-data.json');
    const portfolioData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const socialsList = portfolioData.filter(i => i.listType === 'socials');
    const emailItem = socialsList.find(i => i.title.toLowerCase() === 'email');
    const phoneItem = socialsList.find(i => i.title.toLowerCase() === 'phone');
    const contactEmail = emailItem ? (emailItem.description || emailItem.link || '') : '';
    const contactPhone = phoneItem ? (phoneItem.description || phoneItem.link || '') : '';
    // --------------------------------------------------------

    const filterList = (type) => portfolioData.filter(i => i.listType === type).sort((a, b) => (a.order || 0) - (b.order || 0));

    const renderItems = (items) => items.map(item => `
        <div style="margin-bottom: 12px; border-left: 2px solid #d6d3d1; padding-left: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #1c1917;">
                <span>${item.title || ''}</span>
                <span style="font-size: 11px; color: #57534e; background: #f5f4f0; padding: 1px 6px; border-radius: 4px;">${item.year || ''}</span>
            </div>
            ${item.authors ? `<div style="font-size: 11px; color: #44403c; font-weight: 500; margin-top: 2px;">${item.authors}</div>` : ''}
            ${item.description ? `<div style="font-size: 11px; color: #78716c; margin-top: 2px; line-height: 1.4;">${item.description}</div>` : ''}
        </div>
    `).join('');

    const renderSidebarItems = (items) => items.map(item => `
        <div style="margin-bottom: 10px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1c1917;">
                <span>${item.title || ''}</span>
                <span style="color: #78716c; font-weight: normal;">${item.year || ''}</span>
            </div>
            ${item.authors ? `<div style="color: #44403c;">${item.authors}</div>` : ''}
            ${item.description ? `<div style="color: #78716c;">${item.description}</div>` : ''}
        </div>
    `).join('');

htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; margin: 0; padding: 20px; background: #ffffff; }
        h1, h2, h3 { font-family: Georgia, serif; margin: 0; }
    </style>
</head>
<body>
    <div style="border-bottom: 2px solid #1c1917; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between;">
        <div>
            <h1 style="font-size: 24px; font-weight: bold;">Dr. Prakhar Srivastava</h1>
            <p style="font-size: 10px; text-transform: uppercase; color: #57534e; letter-spacing: 1px; margin-top: 4px;">Ph.D. English | Scholar & Creative Writer</p>
        </div>
        <div style="text-align: right; font-size: 10px; color: #57534e; line-height: 1.4;">
            ${contactEmail ? `<div>${contactEmail}</div>` : ''}
            ${contactPhone ? `<div>${contactPhone}</div>` : ''}
        </div>
    </div>

    <div style="display: flex; gap: 20px;">
        <div style="width: 30%;">
            <div style="background: #f9f8f6; padding: 15px; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 6px; margin-bottom: 8px;">Education & Background</h3>
                ${renderSidebarItems(filterList('background'))}
            </div>
            <div style="background: #f9f8f6; padding: 15px; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 6px; margin-bottom: 8px;">Skills & Expertise</h3>
                ${renderSidebarItems(filterList('skills'))}
            </div>
            <div style="background: #f9f8f6; padding: 15px; border-radius: 8px; border: 1px solid #e7e5e4;">
                <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 6px; margin-bottom: 8px;">References</h3>
                ${renderSidebarItems(filterList('references'))}
            </div>
        </div>

        <div style="width: 70%;">
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">Publications</h2>
                ${renderItems(filterList('publications'))}
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">Presentations & Conferences</h2>
                ${renderItems(filterList('presentations'))}
            </div>
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">Seminars & Courses</h2>
                ${renderItems(filterList('seminars'))}
            </div>
            <div>
                <h2 style="font-size: 14px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">Creative Portfolio</h2>
                ${renderItems(filterList('creative-works'))}
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

    const pdfPath = path.resolve(__dirname, 'Prakhar Srivastava - CV.pdf');
    console.log(`Generating PDF to ${pdfPath}...`);

    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    await browser.close();
    console.log('PDF generated successfully!');
}

generatePDF().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
