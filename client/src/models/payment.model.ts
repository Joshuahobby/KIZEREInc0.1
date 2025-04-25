/**
 * Interface for payment response
 */
export interface InitializePaymentResponse {
  transactionRef: string;
  amount: number;
  redirectUrl: string;
  status: string;
}

/**
 * Interface for payment status response
 */
export interface PaymentStatusResponse {
  status: 'successful' | 'pending' | 'failed' | 'cancelled';
  transactionRef: string;
  amount: number;
  paymentType: 'registration' | 'lost_report';
  paymentDate: string;
  itemId?: number;
  reportId?: number;
}

/**
 * Interface for payment method
 */
export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  provider: string;
  accountNumber: string;
  expiryDate?: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Interface for payment history item
 */
export interface PaymentHistoryItem {
  id: number;
  userId: number;
  amount: string;
  currency: string;
  status: 'successful' | 'pending' | 'failed' | 'cancelled';
  type: 'registration' | 'lost_report';
  transactionRef: string;
  itemId?: number;
  reportId?: number;
  paymentDate: string;
  paymentMethod?: string;
}

/**
 * Interface for payment statistics
 */
export interface PaymentStatistics {
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
}