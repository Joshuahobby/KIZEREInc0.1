import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportMatchingService } from '../services/report-matching.service';
import { storage } from '../storage';
import { Report } from '../../shared/schema';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getReportsWithFilters: vi.fn(),
    createNotification: vi.fn(),
    getUser: vi.fn().mockResolvedValue({ email: 'test@example.com', fullName: 'Test User' }),
  }
}));

// Mock email service
vi.mock('../services/email.service', () => ({
  sendMatchNotificationEmail: vi.fn().mockResolvedValue(true),
}));

describe('ReportMatchingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseReport: Partial<Report> = {
    id: 1,
    userId: 1,
    title: 'iPhone 13 Black',
    description: 'Lost my black iPhone 13 near the mall.',
    location: 'Kigali Mall',
    type: 'lost',
    status: 'Open',
    category: 'Electronics',
    uniqueIdentifier: 'IMEI123456789'
  };

  it('should find a match with exact Unique Identifier', async () => {
    const candidate: Partial<Report> = {
      id: 2,
      userId: 2,
      title: 'Found iPhone',
      location: 'Downtown',
      type: 'found',
      status: 'Open',
      uniqueIdentifier: 'IMEI123456789'
    };

    const mockReports = { reports: [candidate], total: 1, page: 1, totalPages: 1 };
    (storage.getReportsWithFilters as any).mockResolvedValue(mockReports);

    await ReportMatchingService.findMatches(baseReport as Report);

    // Verify notification was created
    expect(storage.createNotification).toHaveBeenCalled();
    const notificationCall = (storage.createNotification as any).mock.calls[0][0];
    expect(notificationCall.message).toContain('100%');
  });

  it('should prefer Item ID match', async () => {
    const candidate: Partial<Report> = {
      id: 3,
      userId: 2,
      title: 'Different Title',
      location: 'Different Place',
      type: 'found',
      status: 'Open',
      itemId: 100
    };

    const source: Partial<Report> = { ...baseReport, itemId: 100, uniqueIdentifier: undefined };

    const mockReports = { reports: [candidate], total: 1, page: 1, totalPages: 1 };
    (storage.getReportsWithFilters as any).mockResolvedValue(mockReports);

    await ReportMatchingService.findMatches(source as Report);

    expect(storage.createNotification).toHaveBeenCalled();
    const notificationCall = (storage.createNotification as any).mock.calls[0][0];
    expect(notificationCall.message).toContain('100%');
  });

  it('should not notify for low scores', async () => {
    const candidate: Partial<Report> = {
      id: 4,
      userId: 2,
      title: 'A Red Scarf',
      location: 'Gisenyi',
      type: 'found',
      status: 'Open',
    };

    const mockReports = { reports: [candidate], total: 1, page: 1, totalPages: 1 };
    (storage.getReportsWithFilters as any).mockResolvedValue(mockReports);

    await ReportMatchingService.findMatches(baseReport as Report);

    expect(storage.createNotification).not.toHaveBeenCalled();
  });
});
