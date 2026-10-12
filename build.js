const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const password = process.env.ADMIN_PASSWORD || 'admin';
html = html.replace('__ADMIN_PASSWORD__', password);
fs.writeFileSync('index.html', html);
console.log('Admin password successfully injected from environment variables.');
