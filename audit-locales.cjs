const fs = require('fs');
const path = require('path');

// Load locale files
const enPath = path.join(__dirname, 'client/src/lib/i18n/locales/en.json');
const rwPath = path.join(__dirname, 'client/src/lib/i18n/locales/rw.json');

function stripBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
}

try {
    const en = JSON.parse(stripBOM(fs.readFileSync(enPath, 'utf8')));
    const rw = JSON.parse(stripBOM(fs.readFileSync(rwPath, 'utf8')));

    // Recursively get all .tsx files
    function getFiles(dir, ext) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filepath = path.join(dir, file);
            const stat = fs.statSync(filepath);
            if (stat.isDirectory()) {
                results = results.concat(getFiles(filepath, ext));
            } else if (filepath.endsWith(ext)) {
                results.push(filepath);
            }
        });
        return results;
    }

    // Extract all t('key') patterns
    function extractKeys(files) {
        const keys = new Set();
        const keyRegex = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            let match;
            while ((match = keyRegex.exec(content)) !== null) {
                keys.add(match[1]);
            }
        });
        return keys;
    }

    // Check if a dot-notation key exists in an object
    function keyExists(obj, key) {
        const parts = key.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return false;
            }
        }
        return true;
    }

    // Run audit
    const srcDir = path.join(__dirname, 'client/src');
    const files = getFiles(srcDir, '.tsx');
    const usedKeys = extractKeys(files);

    console.log(`\n=== LOCALIZATION AUDIT ===`);
    console.log(`Total .tsx files scanned: ${files.length}`);
    console.log(`Total unique translation keys found: ${usedKeys.size}\n`);

    const missingEn = [];
    const missingRw = [];

    const sortedKeys = [...usedKeys].sort();
    sortedKeys.forEach(key => {
        const inEn = keyExists(en, key);
        const inRw = keyExists(rw, key);
        if (!inEn) missingEn.push(key);
        if (!inRw) missingRw.push(key);
    });

    console.log(`--- Missing in en.json (${missingEn.length}) ---`);
    missingEn.forEach(k => console.log(`  x ${k}`));

    console.log(`\n--- Missing in rw.json (${missingRw.length}) ---`);
    missingRw.forEach(k => console.log(`  x ${k}`));

    if (missingEn.length === 0 && missingRw.length === 0) {
        console.log(`\nAll translation keys are present in both locale files!`);
    } else {
        console.log(`\nFound ${missingEn.length + missingRw.length} total missing keys.`);
    }

} catch (err) {
    console.error(`Error parsing JSON or reading files:`, err.message);
    process.exit(1);
}
