import fs from 'fs';

function findDuplicateKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stack = [];
  const keyMaps = [new Map()]; // stack of maps to track keys at each level

  console.log(`Checking ${filePath}...`);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Very simple brace tracking
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;

    const keyMatch = trimmed.match(/^"([^"]+)"\s*:/);
    if (keyMatch) {
      const key = keyMatch[1];
      const currentMap = keyMaps[keyMaps.length - 1];
      if (currentMap.has(key)) {
        console.log(`Duplicate key: "${key}" at line ${index + 1} (previous at line ${currentMap.get(key)})`);
      } else {
        currentMap.set(key, index + 1);
      }
    }

    for (let i = 0; i < openBraces; i++) {
      keyMaps.push(new Map());
    }
    for (let i = 0; i < closeBraces; i++) {
      if (keyMaps.length > 1) {
        keyMaps.pop();
      }
    }
  });
}

findDuplicateKeys('f:/Joe/GetRwanda/2026/KIZEREInc0.1/client/src/lib/i18n/locales/en.json');
findDuplicateKeys('f:/Joe/GetRwanda/2026/KIZEREInc0.1/client/src/lib/i18n/locales/rw.json');
