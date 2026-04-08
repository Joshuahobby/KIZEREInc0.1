import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock object so the vi.mock factory can reference it
const mockStorage = vi.hoisted(() => ({
  getReportsWithFilters: vi.fn(),
  getReport: vi.fn(),
  updateReport: vi.fn(),
  getUser: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("../../storage", () => ({ storage: mockStorage }));
vi.mock("../email.service", () => ({
  sendExpirationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { getExpiringReports, renewReport } from "../report-expiration.service";

describe("getExpiringReports", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeReport = (daysUntilExpiry: number, id = 1) => ({
    id,
    userId: 1,
    type: "lost",
    status: "Open",
    title: "My Phone",
    expirationDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + daysUntilExpiry);
      return d;
    })(),
    gracePeriodEnd: null,
  });

  it("returns reports expiring within the threshold window", async () => {
    const expiringSoon = makeReport(3, 1);    // 3 days → within default 7-day window
    const expiredAlready = makeReport(-1, 2); // already past
    const farOut = makeReport(10, 3);         // outside default 7-day window

    mockStorage.getReportsWithFilters.mockResolvedValueOnce({ reports: [expiringSoon, expiredAlready, farOut] });

    const result = await getExpiringReports(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("excludes reports with no expiration date", async () => {
    mockStorage.getReportsWithFilters.mockResolvedValueOnce({
      reports: [{ id: 4, status: "Open", expirationDate: null }]
    });
    const result = await getExpiringReports(1);
    expect(result).toHaveLength(0);
  });

  it("respects a custom daysThreshold parameter", async () => {
    const r2days = makeReport(2, 10);
    const r4days = makeReport(4, 11);
    mockStorage.getReportsWithFilters.mockResolvedValueOnce({ reports: [r2days, r4days] });

    const result = await getExpiringReports(1, 3); // only within 3 days
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(10);
  });
});

describe("renewReport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for an unknown report", async () => {
    mockStorage.getReport.mockResolvedValueOnce(null);
    const result = await renewReport(999);
    expect(result).toBeNull();
  });

  it("throws for a report with non-renewable status (Resolved)", async () => {
    mockStorage.getReport.mockResolvedValueOnce({ id: 1, status: "Resolved", type: "lost", title: "Test" });
    await expect(renewReport(1)).rejects.toThrow("Cannot renew");
  });

  it("extends an Open report and creates a notification", async () => {
    const report = { id: 1, status: "Open", type: "lost", title: "My Laptop", userId: 5 };
    mockStorage.getReport.mockResolvedValueOnce(report);
    mockStorage.updateReport.mockResolvedValueOnce({ ...report, status: "Open" });
    mockStorage.getUser.mockResolvedValueOnce({ id: 5, email: "a@b.com", fullName: "Alice" });
    mockStorage.createNotification.mockResolvedValueOnce({});

    const result = await renewReport(1, 30);
    expect(result).not.toBeNull();
    expect(mockStorage.updateReport).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "Open",
      gracePeriodEnd: null,
    }));
    expect(mockStorage.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 5,
      type: "report_renewed",
    }));
  });
});
