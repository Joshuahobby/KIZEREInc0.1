import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformSettingsService, PLATFORM_SETTING_KEYS } from "../platform-settings.service";
import { storage } from "../../storage";

vi.mock("../../storage", () => ({
  storage: {
    getPlatformSetting: vi.fn(),
    getAllPlatformSettings: vi.fn(),
    upsertPlatformSetting: vi.fn(),
  },
}));

describe("PlatformSettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSetting", () => {
    it("returns stored value when row exists", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce({ key: "bounty_platform_cut", value: "0.15" });
      const result = await PlatformSettingsService.getSetting("bounty_platform_cut");
      expect(result).toBe("0.15");
    });

    it("returns built-in default when no row exists", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce(undefined);
      const result = await PlatformSettingsService.getSetting(PLATFORM_SETTING_KEYS.BOUNTY_PLATFORM_CUT);
      expect(result).toBe("0.10");
    });

    it("returns null for unknown key with no default", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce(undefined);
      const result = await PlatformSettingsService.getSetting("nonexistent_key");
      expect(result).toBeNull();
    });
  });

  describe("getSettingAsNumber", () => {
    it("returns parsed float from stored value", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce({ key: "bounty_platform_cut", value: "0.20" });
      const result = await PlatformSettingsService.getSettingAsNumber("bounty_platform_cut", 0.10);
      expect(result).toBe(0.20);
    });

    it("returns built-in default (as float) when no row", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce(undefined);
      const result = await PlatformSettingsService.getSettingAsNumber(PLATFORM_SETTING_KEYS.BOUNTY_PLATFORM_CUT, 0.05);
      expect(result).toBe(0.10); // built-in default overrides argument default
    });

    it("returns argument default when key has no row and no built-in default", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce(undefined);
      const result = await PlatformSettingsService.getSettingAsNumber("unknown_key", 0.25);
      expect(result).toBe(0.25);
    });

    it("returns argument default when stored value is not a number", async () => {
      (storage.getPlatformSetting as any).mockResolvedValueOnce({ key: "bad_key", value: "not-a-number" });
      const result = await PlatformSettingsService.getSettingAsNumber("bad_key", 0.33);
      expect(result).toBe(0.33);
    });
  });

  describe("setSetting", () => {
    it("calls upsertPlatformSetting with the correct args", async () => {
      (storage.upsertPlatformSetting as any).mockResolvedValueOnce({});
      await PlatformSettingsService.setSetting("bounty_platform_cut", "0.12", 1, "KIZERE cut on bounties");
      expect(storage.upsertPlatformSetting).toHaveBeenCalledWith(
        "bounty_platform_cut", "0.12", "KIZERE cut on bounties", 1
      );
    });

    it("passes undefined description when omitted", async () => {
      (storage.upsertPlatformSetting as any).mockResolvedValueOnce({});
      await PlatformSettingsService.setSetting("some_key", "value", 42);
      expect(storage.upsertPlatformSetting).toHaveBeenCalledWith("some_key", "value", undefined, 42);
    });
  });

  describe("listSettings", () => {
    it("delegates to storage.getAllPlatformSettings", async () => {
      const rows = [{ id: 1, key: "bounty_platform_cut", value: "0.10" }];
      (storage.getAllPlatformSettings as any).mockResolvedValueOnce(rows);
      const result = await PlatformSettingsService.listSettings();
      expect(result).toEqual(rows);
    });
  });
});
