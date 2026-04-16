import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("PlatformSettingsService");

/**
 * Well-known platform setting keys.
 * bounty_platform_cut: decimal fraction kept by KIZERE on each bounty payout (default 0.10 = 10%)
 */
export const PLATFORM_SETTING_KEYS = {
  BOUNTY_PLATFORM_CUT: "bounty_platform_cut",
} as const;

const DEFAULTS: Record<string, string> = {
  [PLATFORM_SETTING_KEYS.BOUNTY_PLATFORM_CUT]: "0.10",
};

export class PlatformSettingsService {
  /**
   * Retrieve a setting value by key.
   * Returns the stored value, or the built-in default if no row exists, or null if there is no default.
   */
  static async getSetting(key: string): Promise<string | null> {
    const row = await storage.getPlatformSetting(key);
    if (row) return row.value;
    return DEFAULTS[key] ?? null;
  }

  /**
   * Retrieve a setting value as a float.
   * Falls back to defaultValue if the stored value cannot be parsed.
   */
  static async getSettingAsNumber(key: string, defaultValue: number): Promise<number> {
    const raw = await PlatformSettingsService.getSetting(key);
    if (raw === null) return defaultValue;
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      logger.warn("Platform setting is not a valid number, using default", { key, raw, defaultValue });
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Persist a setting. Creates the row if it does not exist; updates it otherwise.
   */
  static async setSetting(
    key: string,
    value: string,
    updatedBy: number,
    description?: string
  ): Promise<void> {
    await storage.upsertPlatformSetting(key, value, description, updatedBy);
    logger.info("Platform setting updated", { key, value, updatedBy });
  }

  /**
   * List all stored settings.
   */
  static async listSettings() {
    return storage.getAllPlatformSettings();
  }
}
