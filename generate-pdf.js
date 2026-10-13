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

    // Load and convert QR code image to base64 for reliable rendering in Puppeteer
    let qrCodeBase64 = '';
    const qrImagePath = path.resolve(__dirname, 'CV Github QR hovercode.png');
    if (fs.existsSync(qrImagePath)) {
        const qrImageBuffer = fs.readFileSync(qrImagePath);
        qrCodeBase64 = `data:image/png;base64,${qrImageBuffer.toString('base64')}`;
    }

    const filterList = (type) => portfolioData.filter(i => i.listType === type).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Dynamic contact extraction from socials
    const socialsList = filterList('socials');
    const emailItem = socialsList.find(i => i.title.toLowerCase() === 'email');
    const phoneItem = socialsList.find(i => i.title.toLowerCase() === 'phone');
    const contactEmail = emailItem ? (emailItem.description || emailItem.link || '') : '';
    const contactPhone = phoneItem ? (phoneItem.description || phoneItem.link || '') : '';

    const renderItems = (items) => items.map(item => `
        <div style="margin-bottom: 15px; border-left: 2px solid #334155; padding-left: 12px; page-break-inside: avoid; break-inside: avoid;">
            <div style="font-family: 'Playfair Display', Georgia, serif; font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 3px;">
                ${parseMarkdown(item.title || '')} 
                <span style="float: right; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-weight: 500;">${item.year || ''}</span>
            </div>
            ${item.authors ? `<div style="font-size: 11px; color: #334155; font-weight: 500; margin-bottom: 3px; font-style: italic;">${parseMarkdown(item.authors)}</div>` : ''}
            ${item.description ? `<div style="font-size: 11px; color: #475569; line-height: 1.45; margin-bottom: 4px;">${parseMarkdown(item.description)}</div>` : ''}
            ${item.customFields && item.customFields.length > 0 ? `
                <div style="font-size: 10px; color: #475569; margin-top: 4px;">
                    ${item.customFields.map(cf => {
                        const keyTrim = cf.key ? cf.key.trim() : '';
                        const valTrim = cf.value || '';
                        return `<span>${keyTrim ? `<strong>${keyTrim}:</strong> ` : ''}${valTrim}</span>`;
                    }).join(' | ')}
                </div>
            ` : ''}
            ${item.link ? `
                <div style="margin-top: 4px;">
                    <a href="${item.link}" style="font-size: 10px; color: #1e3a8a; text-decoration: none; font-weight: 600;">View Publication &#8599;</a>
                </div>
            ` : ''}
        </div>
    `).join('');

    const renderSidebarItems = (items) => items.map(item => {
        const titleHtml = item.link && item.listType === 'background'
            ? `<a href="${item.link}" style="color: #1e3a8a; text-decoration: none;">${parseMarkdown(item.title || '')}</a>`
            : parseMarkdown(item.title || '');

        const authorsHtml = item.link && item.listType === 'extracurriculars'
            ? `<a href="${item.link}" style="color: #1e3a8a; text-decoration: none;">${parseMarkdown(item.authors || '')}</a>`
            : parseMarkdown(item.authors || '');

        return `
            <div style="margin-bottom: 12px; font-size: 11px; page-break-inside: avoid; break-inside: avoid;">
                <div style="font-weight: bold; color: #0f172a;">
                    ${titleHtml} <span style="float: right; font-weight: normal; color: #64748b; font-size: 10px;">${item.year || ''}</span>
                </div>
                ${item.authors ? `<div style="color: #334155; margin-top: 2px; font-weight: 500;">${authorsHtml}</div>` : ''}
                ${item.description ? `<div style="color: #64748b; margin-top: 2px; line-height: 1.35;">${parseMarkdown(item.description)}</div>` : ''}
                ${item.customFields && item.customFields.length > 0 ? `
                    <div style="font-size: 10px; color: #475569; margin-top: 3px; border-top: 1px dashed #cbd5e1; padding-top: 3px;">
                        ${item.customFields.map(cf => {
                            const keyTrim = cf.key ? cf.key.trim() : '';
                            const valTrim = cf.value || '';
                            return `<span>${keyTrim ? `<strong>${keyTrim}:</strong> ` : ''}${valTrim}</span>`;
                        }).join(' | ')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const renderSocialsItems = (items) => items.map(item => {
        let href = item.link || '#';
        if (item.title.toLowerCase() === 'email' && !href.startsWith('mailto:')) href = 'mailto:' + item.description;
        if (item.title.toLowerCase() === 'phone' && !href.startsWith('tel:')) href = 'tel:' + item.description;

        const displayText = item.description || item.link || '';

        return `
            <div style="margin-bottom: 10px; font-size: 11px; page-break-inside: avoid; break-inside: avoid;">
                <div style="font-weight: 600; color: #0f172a; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${parseMarkdown(item.title)}</div>
                ${item.link ? `
                    <div><a href="${href}" style="color: #1e3a8a; text-decoration: none;">${displayText}</a></div>
                ` : `<div style="color: #475569;">${displayText}</div>`}
            </div>
        `;
    }).join('');

    // Pre-evaluate work items to conditionally render section
    const workItems = filterList('work');
    const workSectionHTML = workItems.length > 0 ? `
        <div class="section-group">
            <div class="section-heading">Work Experience</div>
            ${renderItems(workItems)}
        </div>
    ` : '';

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 0; background: #ffffff; }
            h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            .section-group {
                margin-top: 28px;
                margin-bottom: 24px;
            }
            .section-group:first-of-type {
                margin-top: 0;
            }
            .section-heading {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 12px;
                font-weight: bold;
                color: #ffffff;
                background-color: #0f172a;
                padding: 6px 10px;
                margin-bottom: 14px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                page-break-after: avoid;
                break-after: avoid;
            }
            /* Allow sections to break across pages, but prevent individual items/cards from breaking */
            .sidebar-card {
                background: #ffffff;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                margin-bottom: 16px;
                overflow: hidden;
            }
            .cv-footer {
                margin-top: 30px;
                border-top: 1px solid #cbd5e1;
                padding-top: 10px;
                page-break-inside: avoid;
                break-inside: avoid;
            }
        </style>
    </head>
    <body style="padding: 20px;">
        <!-- Header -->
        <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 18px;">
            <table style="width: 100%;">
                <tr>
                    <td>
                        <h1 style="font-size: 24px; font-weight: bold; color: #0f172a;">Dr. Prakhar Srivastava</h1>
                        <p style="font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 1.2px; margin-top: 4px; font-weight: 600;">Ph.D. English &nbsp;|&nbsp; Scholar & Creative Writer</p>
                    </td>
                    <td style="text-align: right; font-size: 10px; color: #475569; line-height: 1.4;">
                        ${contactEmail ? `<div style="font-weight: 500;">${contactEmail}</div>` : ''}
                        ${contactPhone ? `<div>${contactPhone}</div>` : ''}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Layout Table -->
        <table>
            <tr>
                <!-- Left Sidebar -->
                <td style="width: 30%; padding-right: 20px;">
                    <div class="sidebar-card">
                        <div style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 10px; font-weight: bold; letter-spacing: 0.5px; font-family: 'Playfair Display', Georgia, serif;">Education & Background</div>
                        <div style="padding: 10px;">
                            ${renderSidebarItems(filterList('background'))}
                        </div>
                    </div>
                    <div class="sidebar-card">
                        <div style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 10px; font-weight: bold; letter-spacing: 0.5px; font-family: 'Playfair Display', Georgia, serif;">Skills & Expertise</div>
                        <div style="padding: 10px;">
                            ${renderSidebarItems(filterList('skills'))}
                        </div>
                    </div>
                    <div class="sidebar-card">
                        <div style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 10px; font-weight: bold; letter-spacing: 0.5px; font-family: 'Playfair Display', Georgia, serif;">Extracurriculars</div>
                        <div style="padding: 10px;">
                            ${renderSidebarItems(filterList('extracurriculars'))}
                        </div>
                    </div>
                    <div class="sidebar-card">
                        <div style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 10px; font-weight: bold; letter-spacing: 0.5px; font-family: 'Playfair Display', Georgia, serif;">Socials & Links</div>
                        <div style="padding: 10px;">
                            ${renderSocialsItems(socialsList)}
                        </div>
                    </div>
                    <div class="sidebar-card">
                        <div style="background: #ffffff; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 10px; font-weight: bold; letter-spacing: 0.5px; font-family: 'Playfair Display', Georgia, serif;">References</div>
                        <div style="padding: 10px;">
                            ${renderSidebarItems(filterList('references'))}
                        </div>
                    </div>
                </td>

                <!-- Right Main Column -->
                <td style="width: 70%;">
                    ${workSectionHTML}
                    <div class="section-group">
                        <div class="section-heading">Publications</div>
                        ${renderItems(filterList('publications'))}
                    </div>
                    <div class="section-group">
                        <div class="section-heading">Presentations & Conferences</div>
                        ${renderItems(filterList('presentations'))}
                    </div>
                    <div class="section-group">
                        <div class="section-heading">Seminars & Courses</div>
                        ${renderItems(filterList('seminars'))}
                    </div>
                    <div class="section-group">
                        <div class="heading-group">Creative Portfolio</div>
                        ${renderItems(filterList('creative-works'))}
                    </div>

                    <!-- CV Footer -->
                    <div class="cv-footer">
                        <table style="width: 100%;">
                            <tr>
                                <td style="vertical-align: middle;">
                                    <p style="font-size: 11px; color: #334155; margin: 0 0 2px 0; font-weight: 500;">
                                        Kindly visit here to see the latest version of this CV:
                                    </p>
                                    <a href="https://dr-arcady.github.io/prakhar-cv/" style="font-size: 11px; color: #1e3a8a; text-decoration: none; font-weight: bold;">
                                        https://dr-arcady.github.io/prakhar-cv/
                                    </a>
                                </td>
                                <td style="text-align: right; vertical-align: middle; width: 60px;">
                                    ${qrCodeBase64 ? `<img src="${qrCodeBase64}" alt="CV QR Code" style="width: 50px; height: 50px; display: inline-block;" />` : ''}
                                </td>
                            </tr>
                        </table>
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

generatePDF().catch(err =>.console.error('Error generating PDF:', err));
