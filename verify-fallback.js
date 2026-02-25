import en from './client/src/lib/i18n/locales/en.json' assert { type: 'json' };
import rw from './client/src/lib/i18n/locales/rw.json' assert { type: 'json' };

function getRoot(obj) {
    return (obj && obj.default && Object.keys(obj).length === 1) ? obj.default : obj;
}

function traverse(obj, pathKeys) {
    let current = getRoot(obj);
    for (const k of pathKeys) {
        if (current && typeof current === 'object' && k in current) {
            current = current[k];
        } else {
            return undefined;
        }
    }
    return current;
}

function t(key, language) {
    const translations = { en, rw };
    const DEFAULT_LANGUAGE = 'en';
    const keys = key.split(".");
    const currentLangObj = translations[language];

    let value = traverse(currentLangObj, keys);

    if (value === undefined && language !== DEFAULT_LANGUAGE) {
        const defaultLangObj = translations[DEFAULT_LANGUAGE];
        value = traverse(defaultLangObj, keys);
    }

    return value || key;
}

console.log('Test 1: Existing RW key "common.appName" ->', t('common.appName', 'rw'));
console.log('Test 2: Missing RW key "common.darkMode" (fallback to EN) ->', t('common.darkMode', 'rw'));
console.log('Test 3: Deeply nested fallback "dashboard.welcomeMessage" ->', t('dashboard.welcomeMessage', 'rw'));
