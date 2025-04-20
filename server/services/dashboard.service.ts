import { storage } from '../storage';
import { createLogger } from '../../client/src/lib/logger';
import { UserRole } from '../../shared/schema';

const logger = createLogger('DashboardService');

export interface RevenueComparison {
  thisMonth: number;
  lastMonth: number;
  percentChange: number;
}

export interface PaymentTypeStatistics {
  type: string;
  amount: number;
  count: number;
}

export interface PaymentStatusStatistics {
  status: string;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface AdminPaymentSummary {
  totalRevenue: number;
  revenueComparison: RevenueComparison;
  registrationsComparison: RevenueComparison;
  paymentsByType: PaymentTypeStatistics[];
  paymentsByStatus: PaymentStatusStatistics[];
  monthlyRevenue: MonthlyRevenue[];
  recentTransactions: any[];
}

/**
 * Service for dashboard-related operations
 */
export class DashboardService {
  /**
   * Get all payment statistics summary for admin dashboard
   */
  async getAdminPaymentSummary(): Promise<AdminPaymentSummary> {
    try {
      // Get all payments
      const allPayments = await storage.getAllPayments();
      
      // Calculate total revenue (only from successful payments)
      const totalRevenue = allPayments
        .filter(p => p.status === 'successful')
        .reduce((total, payment) => total + (parseFloat(payment.amount as string) || 0), 0);
      
      // Get this month's and last month's revenue for comparison
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const thisYear = now.getFullYear();
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      // Revenue from this month
      const thisMonthRevenue = allPayments
        .filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate.getMonth() === thisMonth && 
                 paymentDate.getFullYear() === thisYear &&
                 p.status === 'successful';
        })
        .reduce((total, payment) => total + (parseFloat(payment.amount as string) || 0), 0);
      
      // Revenue from last month
      const lastMonthRevenue = allPayments
        .filter(p => {
          const paymentDate = new Date(p.createdAt);
          return paymentDate.getMonth() === lastMonth && 
                 paymentDate.getFullYear() === lastMonthYear &&
                 p.status === 'successful';
        })
        .reduce((total, payment) => total + (parseFloat(payment.amount as string) || 0), 0);
      
      // Calculate percentage change
      const revenuePercentChange = lastMonthRevenue === 0 
        ? 100 
        : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Get user registrations this month and last month
      const thisMonthRegistrations = allUsers.filter(u => {
        const registrationDate = new Date(u.createdAt);
        return registrationDate.getMonth() === thisMonth && 
               registrationDate.getFullYear() === thisYear;
      }).length;
      
      const lastMonthRegistrations = allUsers.filter(u => {
        const registrationDate = new Date(u.createdAt);
        return registrationDate.getMonth() === lastMonth && 
               registrationDate.getFullYear() === lastMonthYear;
      }).length;
      
      // Calculate registration percentage change
      const registrationPercentChange = lastMonthRegistrations === 0 
        ? 100 
        : Math.round(((thisMonthRegistrations - lastMonthRegistrations) / lastMonthRegistrations) * 100);
      
      // Calculate payments by type
      const paymentsByType: PaymentTypeStatistics[] = [];
      const typeMap = new Map<string, { amount: number, count: number }>();
      
      allPayments.forEach(payment => {
        if (payment.status === 'successful') {
          const currentType = typeMap.get(payment.type) || { amount: 0, count: 0 };
          typeMap.set(payment.type, {
            amount: currentType.amount + (parseFloat(payment.amount as string) || 0),
            count: currentType.count + 1
          });
        }
      });
      
      typeMap.forEach((value, type) => {
        paymentsByType.push({
          type,
          amount: value.amount,
          count: value.count
        });
      });
      
      // Calculate payments by status
      const paymentsByStatus: PaymentStatusStatistics[] = [];
      const statusMap = new Map<string, number>();
      
      allPayments.forEach(payment => {
        const currentCount = statusMap.get(payment.status) || 0;
        statusMap.set(payment.status, currentCount + 1);
      });
      
      statusMap.forEach((count, status) => {
        paymentsByStatus.push({ status, count });
      });
      
      // Generate monthly revenue data for the last 6 months
      const monthlyRevenue: MonthlyRevenue[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        let month = thisMonth - i;
        let year = thisYear;
        
        if (month < 0) {
          month += 12;
          year -= 1;
        }
        
        const monthRevenue = allPayments
          .filter(p => {
            const paymentDate = new Date(p.createdAt);
            return paymentDate.getMonth() === month && 
                   paymentDate.getFullYear() === year &&
                   p.status === 'successful';
          })
          .reduce((total, payment) => total + (parseFloat(payment.amount as string) || 0), 0);
        
        monthlyRevenue.push({
          month: `${monthNames[month]} ${year}`,
          revenue: monthRevenue
        });
      }
      
      // Get recent transactions (limit to 10)
      const recentTransactions = allPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      return {
        totalRevenue,
        revenueComparison: {
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          percentChange: revenuePercentChange
        },
        registrationsComparison: {
          thisMonth: thisMonthRegistrations,
          lastMonth: lastMonthRegistrations,
          percentChange: registrationPercentChange
        },
        paymentsByType,
        paymentsByStatus,
        monthlyRevenue,
        recentTransactions
      };
    } catch (error) {
      logger.error('Error getting admin payment summary', { error });
      throw error;
    }
  }
  
  /**
   * Get role-based dashboard statistics
   */
  async getUserDashboardStats(userId: number, role: UserRole) {
    try {
      // Get user's items
      const items = await storage.getUserItems(userId);
      
      // Get user's reports
      const reports = await storage.getUserReports(userId);
      
      // Get user's notifications
      const notifications = await storage.getUserNotifications(userId);
      
      // Get user's payments
      const payments = await storage.getUserPayments(userId);
      
      // Calculate basic stats
      const totalItems = items.length;
      const totalLostReports = reports.filter(r => r.type === 'lost').length;
      const totalFoundReports = reports.filter(r => r.type === 'found').length;
      const totalSpent = payments
        .filter(p => p.status === 'successful')
        .reduce((total, payment) => total + (parseFloat(payment.amount as string) || 0), 0);
      
      // Sort items by registration date to get the most recent
      const sortedItems = [...items].sort((a, b) => 
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
      const recentlyAddedItems = sortedItems.slice(0, 5);
      
      // Count pending payments
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      
      // Count unread notifications
      const unreadNotifications = notifications.filter(n => !n.isRead).length;
      
      // Return user stats
      return {
        totalItems,
        totalLostReports,
        totalFoundReports,
        totalSpent,
        recentlyAddedItems,
        pendingPayments,
        unreadNotifications
      };
    } catch (error) {
      logger.error('Error getting user dashboard stats', { error, userId });
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();