const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'client/src/lib/i18n/locales');

function stripBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) return content.slice(1);
    return content;
}

function readLocale(name) {
    return JSON.parse(stripBOM(fs.readFileSync(path.join(LOCALES_DIR, `${name}.json`), 'utf8')));
}

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

/** Recursively collect all leaf dot-notation keys from a locale object. */
function getAllLeafKeys(obj, prefix = '') {
    const keys = [];
    for (const k of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (obj[k] !== null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            keys.push(...getAllLeafKeys(obj[k], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

try {
    const en = readLocale('en');
    const rw = readLocale('rw');
    const fr = readLocale('fr');
    const sw = readLocale('sw');

    const locales = { rw, fr, sw };
    const enLeafKeys = getAllLeafKeys(en);

    // --- Part 1: Key coverage vs en.json for all locales ---
    console.log(`\n=== LOCALE KEY COVERAGE vs en.json (${enLeafKeys.length} total keys) ===\n`);
    let hasAnyMissing = false;

    for (const [name, obj] of Object.entries(locales)) {
        const missing = enLeafKeys.filter(k => !keyExists(obj, k));
        const pct = (((enLeafKeys.length - missing.length) / enLeafKeys.length) * 100).toFixed(1);
        if (missing.length > 0) {
            hasAnyMissing = true;
            console.log(`${name}.json: ${missing.length} missing keys (${pct}% coverage)`);
            missing.slice(0, 10).forEach(k => console.log(`  x ${k}`));
            if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`);
        } else {
            console.log(`${name}.json: 100% coverage ✓`);
        }
    }

    // --- Part 2: Used-key audit (keys referenced in .tsx but missing from locales) ---
    const srcDir = path.join(__dirname, 'client/src');
    const files = getFiles(srcDir, '.tsx');
    const usedKeys = extractKeys(files);

    console.log(`\n=== USED KEY AUDIT ===`);
    console.log(`Total .tsx files scanned: ${files.length}`);
    console.log(`Total unique t() keys found: ${usedKeys.size}\n`);

    const allLocales = { en, rw, fr, sw };
    let usedMissing = 0;
    for (const [name, obj] of Object.entries(allLocales)) {
        const missing = [...usedKeys].sort().filter(k => !keyExists(obj, k));
        if (missing.length > 0) {
            usedMissing += missing.length;
            console.log(`--- Used keys missing in ${name}.json (${missing.length}) ---`);
            missing.forEach(k => console.log(`  x ${k}`));
        }
    }
    if (usedMissing === 0) {
        console.log(`All used translation keys are present in all locale files!`);
    }

    if (hasAnyMissing || usedMissing > 0) {
        console.log(`\nRun: npx tsx scripts/sync-locales.ts  to fill missing fr/sw keys.`);
        process.exit(1);
    } else {
        console.log(`\nAll locale files are in sync!`);
        process.exit(0);
    }

} catch (err) {
    console.error(`Error:`, err.message);
    process.exit(1);
}
