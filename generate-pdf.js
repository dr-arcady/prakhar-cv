const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const portfolioData = Array.isArray(rawData) ? rawData : (rawData.items || []);
    const profile = rawData.profile || {
        name: "Dr. Prakhar Srivastava",
        subtitle: "Scholar & Creative Writer",
        degree: "Ph.D., English"
    };

    const allListsConfig = [
        { key: 'work', title: 'Work Experience', region: 'main', order: 1 },
        { key: 'publications', title: 'Publications', region: 'main', order: 2 },
        { key: 'presentations', title: 'Presentations & Conferences', region: 'main', order: 3 },
        { key: 'seminars', title: 'Seminars, Courses & More', region: 'main', order: 4 },
        { key: 'creative-works', title: 'Creative Portfolio', region: 'main', order: 5 },
        { key: 'background', title: 'Education & Background', region: 'sidebar', order: 1 },
        { key: 'skills', title: 'Skills & Expertise', region: 'sidebar', order: 2 },
        { key: 'extracurriculars', title: 'Extracurriculars', region: 'sidebar', order: 3 },
        { key: 'references', title: 'References', region: 'sidebar', order: 4 }
    ];
    
    let qrCodeBase64 = '';
    const qrImagePath = path.resolve(__dirname, 'CV Vercel QR hovercode.png');
    if (fs.existsSync(qrImagePath)) {
        const qrImageBuffer = fs.readFileSync(qrImagePath);
        qrCodeBase64 = `data:image/png;base64,${qrImageBuffer.toString('base64')}`;
    }

    const filterList = (listType) => portfolioData.filter(i => i.listType === listType).sort((a, b) => (a.order || 0) - (b.order || 0));

    const socialsList = filterList('socials');

    const renderMainItems = (items) => items.map(item => {
        let titleHtml = parseMarkdown(item.title || '');
        let authorsHtml = item.authors ? parseMarkdown(item.authors) : '';
        let descHtml = item.description ? parseMarkdown(item.description) : '';
        let customLinkHtml = '';

        if (item.link) {
            const target = item.linkTarget || 'custom';
            const labelText = item.linkText || 'View Work';
            if (target === 'title') {
                titleHtml = `<a href="${item.link}" style="color: #0f172a; text-decoration: underline;">${parseMarkdown(item.title || '')} &#8599;</a>`;
            } else if (target === 'authors' && item.authors) {
                authorsHtml = `<a href="${item.link}" style="color: #1e3a8a; text-decoration: underline; font-weight: 600;">${parseMarkdown(item.authors)} &#8599;</a>`;
            } else if (target === 'description' && item.description) {
                descHtml = `<a href="${item.link}" style="color: #1e3a8a; text-decoration: underline;">${parseMarkdown(item.description)} &#8599;</a>`;
            } else {
                customLinkHtml = `
                    <div style="margin-top: 4px;">
                        <a href="${item.link}" style="font-size: 10px; color: #1e3a8a; text-decoration: none; font-weight: 600;">${parseMarkdown(labelText)} &#8599;</a>
                    </div>
                `;
            }
        }

        return `
            <div style="margin-bottom: 15px; border-left: 2px solid #334155; padding-left: 12px; page-break-inside: avoid; break-inside: avoid;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 3px;">
                    ${titleHtml} 
                    <span style="float: right; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-weight: 500;">${item.year || ''}</span>
                </div>
                ${authorsHtml ? `<div style="font-size: 11px; color: #334155; font-weight: 500; margin-bottom: 3px; font-style: italic;">${authorsHtml}</div>` : ''}
                ${descHtml ? `<div style="font-size: 11px; color: #475569; line-height: 1.45; margin-bottom: 4px;">${descHtml}</div>` : ''}
                ${item.customFields && item.customFields.length > 0 ? `
                    <div style="font-size: 10px; color: #475569; margin-top: 4px;">
                        ${item.customFields.map(cf => {
                            const keyTrim = cf.key ? cf.key.trim() : '';
                            const valTrim = cf.value || '';
                            return `<span>${keyTrim ? `<strong>${keyTrim}:</strong> ` : ''}${valTrim}</span>`;
                        }).join(' | ')}
                    </div>
                ` : ''}
                ${customLinkHtml}
            </div>
        `;
    }).join('');
    
    // Render Sidebar Sections matched to main area layout (vertical accent line, section-heading, no outer boxes)
    const renderSidebarSection = (listConfig) => {
        const items = filterList(listConfig.key);
        if (items.length === 0 && listConfig.key !== 'socials') return '';

        if (listConfig.key === 'socials') {
            return `
                <div class="section-group">
                    <div class="section-heading">${listConfig.title}</div>
                    <div style="font-size: 11px;">
                        ${socialsList.map(item => {
                            let href = item.link || '#';
                            if (item.title.toLowerCase() === 'email' && !href.startsWith('mailto:')) href = 'mailto:' + item.description;
                            if (item.title.toLowerCase() === 'phone' && !href.startsWith('tel:')) href = 'tel:' + item.description;
                            const displayText = item.description || item.link || '';
                            return `
                                <div style="margin-bottom: 12px; border-left: 2px solid #334155; padding-left: 10px; page-break-inside: avoid; break-inside: avoid;">
                                    <div style="font-weight: 600; color: #0f172a; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${parseMarkdown(item.title)}</div>${item.link ? `<div><a href="${href}" style="color: #1e3a8a; text-decoration: none;">${displayText}</a></div>` : `<div style="color: #475569;">${displayText}</div>`}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        const renderItemHtml = (item) => `
            <div style="margin-bottom: 15px; border-left: 2px solid #334155; padding-left: 10px; page-break-inside: avoid; break-inside: avoid;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-weight: bold; font-size: 12px; color: #0f172a; margin-bottom: 3px;">
                    ${parseMarkdown(item.title || '')} 
                    ${item.year ? `<span style="display: block; font-family: 'Inter', sans-serif; font-weight: normal; color: #64748b; font-size: 10px; margin-top: 2px;">${item.year}</span>` : ''}
                </div>
                ${item.authors ? `<div style="font-size: 11px; color: #334155; margin-top: 2px; font-weight: 500;">${parseMarkdown(item.authors)}</div>` : ''}
                ${item.description ? `<div style="font-size: 11px; color: #475569; margin-top: 2px; line-height: 1.35;">${parseMarkdown(item.description)}</div>` : ''}
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

        const isFirst = sidebarLists[0] && sidebarLists[0].key === listConfig.key;

        return `
            <div class="section-group" style="margin-top: ${isFirst ? '0' : '28px'}; margin-bottom: 24px;">
                <div class="section-heading">${listConfig.title}</div>
                <div style="font-size: 11px;">
                    ${items.map(item => renderItemHtml(item)).join('')}
                </div>
            </div>
        `;
    };

    const allLists = [...allListsConfig];
    allLists.sort((a, b) => (a.order || 0) - (b.order || 0));

    const mainLists = allLists.filter(l => l.region !== 'sidebar');
    const sidebarLists = allLists.filter(l => l.region === 'sidebar');

    const mainHTML = mainLists.map(l => {
        const items = filterList(l.key);
        if (items.length === 0) return '';
        return `
            <div class="section-group">
                <div class="section-heading">${l.title}</div>
                ${renderMainItems(items)}
            </div>
        `;
    }).join('');

    const sidebarHTML = sidebarLists.map(l => renderSidebarSection(l)).join('');

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
            .section-group { margin-top: 28px; margin-bottom: 24px; }
            .section-group:first-of-type { margin-top: 0; }
            .section-heading {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 12px; font-weight: bold; color: #ffffff; background-color: #0f172a;
                padding: 6px 10px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.8px;
            }
            .cv-footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; page-break-inside: avoid; }
        </style>
    </head>
    <body style="padding: 20px;">
        <div style="margin-bottom: 25px;">
            <div style="margin-bottom: 12px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #0f172a; line-height: 1.2;">${parseMarkdown(profile.name)}</h1>
                <p style="font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 1.2px; margin-top: 4px; font-weight: 600;">${parseMarkdown(profile.degree)} &nbsp;|&nbsp; ${parseMarkdown(profile.subtitle)}</p>
            </div>
            <div style="background-color: #ffffff; border-top: 2px solid #334155; border-bottom: 2px solid #334155; padding: 8px 12px; font-size: 9.5px; color: #334155;">
                ${(() => {
                    const items = socialsList;
                    const total = items.length;
                    if (total === 0) return '';

                    const maxPerLine = 4;
                    let rows = [];
                    for (let i = 0; i < total; i += maxPerLine) {
                        rows.push(items.slice(i, i + maxPerLine));
                    }

                    return rows.map((rowItems, rowIndex) => {
                        const rowCount = rowItems.length;
                        let justifyContent = 'space-between';
                        if (rowCount === 1) {
                            justifyContent = 'center';
                        } else if (rowCount === 2) {
                            justifyContent = 'space-between';
                        }

                        const rowStyle = `display: flex; justify-content: ${justifyContent}; align-items: center; width: 100%;` + (rowIndex === 0 ? '' : ' margin-top: 5px;');
                        
                        const itemsHtml = rowItems.map(item => {
                            const val = item.description || item.link || '';
                            const href = item.link || '#';
                            return `<span style="white-space: nowrap;"><strong style="color: #0f172a;">${parseMarkdown(item.title)}:</strong> <a href="${href}" style="color: #1e3a8a; text-decoration: none;">${val}</a></span>`;
                        }).join('');

                        return `<div style="${rowStyle}">${itemsHtml}</div>`;
                    }).join('');
                })()}
            </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
            <tr>
                <td style="width: 30%; padding: 0; vertical-align: top;">
                    <div style="background-color: #f8fafc; padding: 0 12px; display: inline-block; width: 100%; box-sizing: border-box;">
                        ${sidebarHTML}
                    </div>
                </td>
                <td style="width: 70%; padding-left: 20px; vertical-align: top;">
                    ${mainHTML}
                    <div class="cv-footer">
                        <table style="width: 100%;">
                            <tr>
                                <td style="vertical-align: middle;">
                                    <p style="font-size: 11px; color: #334155; margin: 0 0 2px 0; font-weight: 500;">
                                        Kindly visit here to see the latest version of this CV and to access weblinks of resources:
                                    </p>
                                    <a href="https://dr-prakhar-cv.vercel.app/" style="font-size: 11px; color: #1e3a8a; text-decoration: none; font-weight: bold;">
                                        https://dr-prakhar-cv.vercel.app/
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
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

    const pdfPath = path.resolve(__dirname, 'Prakhar Srivastava - CV.pdf');
    console.log(`Generating PDF to ${pdfPath}...`);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });

    await browser.close();
    console.log('PDF generated successfully!');
}

module.exports = { generatePDF };

if (require.main === module) {
    generatePDF().catch(err => {
        console.error('Error generating PDF:', err);
        process.exit(1);
    });
}
