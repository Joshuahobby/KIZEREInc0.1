/**
 * sync-locales.ts
 *
 * Syncs fr.json and sw.json to have 100% key coverage with en.json.
 * Missing keys are filled with "[TODO-xx] <rw_value>" stubs (or en value
 * as a fallback when rw also lacks the key).
 *
 * Usage:  npx tsx sync-locales.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "client/src/lib/i18n/locales");
const REPORT_PATH = path.join(__dirname, "sync-locales-report.txt");

function stripBOM(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function readLocale(name: string): Record<string, any> {
  const filePath = path.join(LOCALES_DIR, `${name}.json`);
  return JSON.parse(stripBOM(fs.readFileSync(filePath, "utf8")));
}

function writeLocale(name: string, data: Record<string, any>): void {
  const filePath = path.join(LOCALES_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Returns dot-notation paths of every leaf key in `source` missing from `target`. */
function getMissingKeys(
  source: Record<string, any>,
  target: Record<string, any>,
  prefix = ""
): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const srcVal = source[key];
    const tgtVal = target[key];

    if (srcVal !== null && typeof srcVal === "object" && !Array.isArray(srcVal)) {
      // Recurse into nested objects
      missing.push(
        ...getMissingKeys(srcVal, typeof tgtVal === "object" && tgtVal ? tgtVal : {}, fullKey)
      );
    } else {
      if (tgtVal === undefined) {
        missing.push(fullKey);
      }
    }
  }
  return missing;
}

/** Resolves a dot-notation key inside a nested object. */
function getNestedValue(obj: Record<string, any>, key: string): string | undefined {
  const parts = key.split(".");
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/** Sets a dot-notation key inside a nested object, creating intermediate objects. */
function setNestedValue(obj: Record<string, any>, key: string, value: string): void {
  const parts = key.split(".");
  let cur: Record<string, any> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!cur[part] || typeof cur[part] !== "object") {
      cur[part] = {};
    }
    cur = cur[part];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * Fills missing keys in `target` by copying from `fallback` (rw) with a TODO prefix.
 * Falls back to `source` (en) value when rw also lacks the key.
 * Returns { updated: object, addedKeys: string[] }
 */
function fillMissingKeys(
  source: Record<string, any>,
  target: Record<string, any>,
  fallback: Record<string, any>,
  locale: string
): { updated: Record<string, any>; addedKeys: string[] } {
  // Deep-clone target so we don't mutate the original
  const updated: Record<string, any> = JSON.parse(JSON.stringify(target));
  const missingKeys = getMissingKeys(source, target);
  const addedKeys: string[] = [];

  for (const key of missingKeys) {
    const rwValue = getNestedValue(fallback, key);
    const enValue = getNestedValue(source, key);
    const stub = rwValue
      ? `[TODO-${locale}] ${rwValue}`
      : enValue
      ? `[TODO-${locale}] ${enValue}`
      : `[TODO-${locale}]`;
    setNestedValue(updated, key, stub);
    addedKeys.push(key);
  }

  return { updated, addedKeys };
}

function main() {
  console.log("=== KIZERE Locale Sync ===\n");

  const en = readLocale("en");
  const rw = readLocale("rw");

  const reportLines: string[] = [`KIZERE Locale Sync Report — ${new Date().toISOString()}\n`];
  let totalAdded = 0;

  for (const locale of ["fr", "sw"] as const) {
    const target = readLocale(locale);
    const { updated, addedKeys } = fillMissingKeys(en, target, rw, locale);

    if (addedKeys.length > 0) {
      writeLocale(locale, updated);
      reportLines.push(`\n--- ${locale}.json: added ${addedKeys.length} keys ---`);
      addedKeys.forEach((k) => reportLines.push(`  + ${k}`));
    }

    totalAdded += addedKeys.length;
    console.log(`${locale}: added ${addedKeys.length} keys`);
  }

  reportLines.push(`\nTotal keys added: ${totalAdded}`);
  fs.writeFileSync(REPORT_PATH, reportLines.join("\n") + "\n", "utf8");

  console.log(`\nTotal: ${totalAdded} keys added across fr + sw`);
  console.log(`Report written to: ${REPORT_PATH}`);
  process.exit(0);
}

main();
