import fs from 'fs';

function findDuplicates(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const seenPaths = new Set();
  
  JSON.parse(content, function(key, value) {
    if (key && typeof value === 'object' && !Array.isArray(value)) {
       // This doesn't work because the receiver is called bottom-up and duplicates are already resolved.
    }
    return value;
  });

  // Manual check for "key": multiple times in the same block
  const lines = content.split('\n');
  const stack = [new Set()];
  const indentStack = [-1];

  lines.forEach((line, i) => {
    const match = line.match(/^(\s*)"([^"]+)"\s*:/);
    if (match) {
      const indent = match[1].length;
      const key = match[2];
      
      while (indent <= indentStack[indentStack.length - 1]) {
        stack.pop();
        indentStack.pop();
      }
      
      if (indent > indentStack[indentStack.length - 1]) {
        stack.push(new Set());
        indentStack.push(indent);
      }
      
      const currentSet = stack[stack.length - 1];
      if (currentSet.has(key)) {
        console.log(`DUPLICATE KEY: "${key}" at line ${i + 1}`);
      }
      currentSet.add(key);
    }
  });
}

findDuplicates('f:/Joe/GetRwanda/2026/KIZEREInc0.1/client/src/lib/i18n/locales/en.json');
findDuplicates('f:/Joe/GetRwanda/2026/KIZEREInc0.1/client/src/lib/i18n/locales/rw.json');
