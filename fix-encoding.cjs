const fs = require('fs');
const path = 'f:/Joe/GetRwanda/2026/KIZEREInc0.1/client/src/lib/i18n/locales/en.json';
try {
    const content = fs.readFileSync(path, 'utf8');
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully converted en.json to UTF-8');
} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
