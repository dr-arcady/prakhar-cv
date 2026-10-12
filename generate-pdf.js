const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Simple Markdown parser helper for bold (**text**) and italic (*text*)
function parseMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

async function generatePDF() {
    console.log('Reading portfolio data...');
    const dataPath = path.resolve(__dirname, 'portfolio-data.json');
    const portfolioData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const filterList = (type) => portfolioData.filter(i => i.listType === type).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Dynamic contact extraction from socials
    const socialsList = filterList('socials');
    const emailItem = socialsList.find(i => i.title.toLowerCase() === 'email');
    const phoneItem = socialsList.find(i => i.title.toLowerCase() === 'phone');
    const contactEmail = emailItem ? (emailItem.description || emailItem.link || '') : '';
    const contactPhone = phoneItem ? (phoneItem.description || phoneItem.link || '') : '';

    const renderItems = (items) => items.map(item => `
        <div style="margin-bottom: 14px; border-left: 2px solid #78716c; padding-left: 12px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 13px; color: #1c1917; margin-bottom: 2px;">
                ${parseMarkdown(item.title || '')} 
                <span style="float: right; font-size: 11px; color: #57534e; background: #f5f4f0; padding: 1px 6px; border-radius: 4px; font-weight: normal;">${item.year || ''}</span>
            </div>
            ${item.authors ? `<div style="font-size: 11px; color: #44403c; font-weight: 500; margin-bottom: 2px;">${parseMarkdown(item.authors)}</div>` : ''}
            ${item.description ? `<div style="font-size: 11px; color: #57534e; line-height: 1.4; margin-bottom: 4px;">${parseMarkdown(item.description)}</div>` : ''}
            ${item.customFields && item.customFields.length > 0 ? `
                <div style="font-size: 10px; color: #57534e; margin-top: 3px;">
                    ${item.customFields.map(cf => `<span style="background: #f5f4f0; padding: 2px 6px; border-radius: 3px; margin-right: 6px; display: inline-block; margin-bottom: 3px;"><strong>${cf.key}:</strong> ${cf.value}</span>`).join('')}
                </div>
            ` : ''}
            ${item.link ? `
                <div style="margin-top: 4px;">
                    <a href="${item.link}" style="font-size: 10px; color: #1e3a8a; text-decoration: none; font-weight: bold;"><i class="fa-solid fa-arrow-up-right-from-square"></i> See document / Link</a>
                </div>
            ` : ''}
        </div>
    `).join('');

    const renderSidebarItems = (items) => items.map(item => `
        <div style="margin-bottom: 12px; font-size: 11px; page-break-inside: avoid;">
            <div style="font-weight: bold; color: #1c1917;">
                ${parseMarkdown(item.title || '')} <span style="float: right; font-weight: normal; color: #78716c;">${item.year || ''}</span>
            </div>
            ${item.authors ? `<div style="color: #44403c; margin-top: 1px;">${parseMarkdown(item.authors)}</div>` : ''}
            ${item.description ? `<div style="color: #57534e; margin-top: 1px; line-height: 1.3;">${parseMarkdown(item.description)}</div>` : ''}
            ${item.link ? `<div style="margin-top: 2px;"><a href="${item.link}" style="color: #1e3a8a; text-decoration: none; font-size: 10px;">${item.description ? item.link : 'Visit Link'}</a></div>` : ''}
        </div>
    `).join('');

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; margin: 0; padding: 0; background: #ffffff; }
            h1, h2, h3 { font-family: Georgia, serif; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
        </style>
    </head>
    <body style="padding: 20px;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #1c1917; padding-bottom: 12px; margin-bottom: 20px;">
            <table style="width: 100%;">
                <tr>
                    <td>
                        <h1 style="font-size: 22px; font-weight: bold;">Dr. Prakhar Srivastava</h1>
                        <p style="font-size: 10px; text-transform: uppercase; color: #57534e; letter-spacing: 1px; margin-top: 4px;">Ph.D. English | Scholar & Creative Writer</p>
                    </td>
                    <td style="text-align: right; font-size: 10px; color: #57534e; line-height: 1.4;">
                        ${contactEmail ? `<div>${contactEmail}</div>` : ''}
                        ${contactPhone ? `<div>${contactPhone}</div>` : ''}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Layout Table -->
        <table>
            <tr>
                <!-- Left Sidebar -->
                <td style="width: 32%; padding-right: 20px;">
                    <div style="background: #f9f8f6; padding: 12px; border-radius: 6px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                        <h3 style="font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">Education & Background</h3>
                        ${renderSidebarItems(filterList('background'))}
                    </div>
                    <div style="background: #f9f8f6; padding: 12px; border-radius: 6px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                        <h3 style="font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">Skills & Expertise</h3>
                        ${renderSidebarItems(filterList('skills'))}
                    </div>
                    <div style="background: #f9f8f6; padding: 12px; border-radius: 6px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                        <h3 style="font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">Extracurriculars</h3>
                        ${renderSidebarItems(filterList('extracurriculars'))}
                    </div>
                    <div style="background: #f9f8f6; padding: 12px; border-radius: 6px; border: 1px solid #e7e5e4; margin-bottom: 15px;">
                        <h3 style="font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">Socials & Links</h3>
                        ${renderSidebarItems(socialsList)}
                    </div>
                    <div style="background: #f9f8f6; padding: 12px; border-radius: 6px; border: 1px solid #e7e5e4;">
                        <h3 style="font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px;">References</h3>
                        ${renderSidebarItems(filterList('references'))}
                    </div>
                </td>

                <!-- Right Main Column -->
                <td style="width: 68%;">
                    <div style="margin-bottom: 18px;">
                        <h2 style="font-size: 13px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Publications</h2>
                        ${renderItems(filterList('publications'))}
                    </div>
                    <div style="margin-bottom: 18px;">
                        <h2 style="font-size: 13px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Presentations & Conferences</h2>
                        ${renderItems(filterList('presentations'))}
                    </div>
                    <div style="margin-bottom: 18px;">
                        <h2 style="font-size: 13px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Seminars & Courses</h2>
                        ${renderItems(filterList('seminars'))}
                    </div>
                    <div>
                        <h2 style="font-size: 13px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Creative Portfolio</h2>
                        ${renderItems(filterList('creative-works'))}
                    </div>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

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
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' }
    });

    await browser.close();
    console.log('PDF generated successfully!');
}

generatePDF().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
