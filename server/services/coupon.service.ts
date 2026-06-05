import { storage } from '../storage';
import { Coupon, PaymentType } from '@shared/schema';
import { createLogger } from '../utils/logger';

const logger = createLogger('CouponLogicService');

export interface CouponValidationResult {
  isValid: boolean;
  message?: string;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
}

export class CouponService {
  /**
   * Validates a coupon code for a specific transaction
   */
  static async validateCoupon(
    code: string,
    userId: number,
    amount: number,
    type: PaymentType
  ): Promise<CouponValidationResult> {
    try {
      logger.info('Validating coupon', { code, userId, amount, type });

      const coupon = await storage.getCouponByCode(code);

      if (!coupon) {
        return { isValid: false, message: 'Invalid coupon code', discountAmount: 0, finalAmount: amount };
      }

      if (coupon.status !== 'active') {
        return { isValid: false, message: 'This coupon is inactive', discountAmount: 0, finalAmount: amount };
      }

      const now = new Date();
      if (coupon.validFrom > now) {
        return { isValid: false, message: 'This coupon is not yet valid', discountAmount: 0, finalAmount: amount };
      }

      if (coupon.validUntil && coupon.validUntil < now) {
        return { isValid: false, message: 'This coupon has expired', discountAmount: 0, finalAmount: amount };
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { isValid: false, message: 'This coupon has reached its usage limit', discountAmount: 0, finalAmount: amount };
      }

      // Enforce per-user limit: one use per coupon per user
      const userPayments = await storage.getUserPayments(userId);
      const alreadyUsed = userPayments.some(
        p => (p.metadata as any)?.couponId === coupon.id
      );
      if (alreadyUsed) {
        return { isValid: false, message: 'You have already used this coupon', discountAmount: 0, finalAmount: amount };
      }

      if (coupon.applicableType !== 'all' && coupon.applicableType !== type) {
        return { 
          isValid: false, 
          message: `This coupon is only valid for ${coupon.applicableType.replace('_', ' ')} services`, 
          discountAmount: 0, 
          finalAmount: amount 
        };
      }

      const minPurchase = Number(coupon.minPurchase || 0);
      if (amount < minPurchase) {
        return { 
          isValid: false, 
          message: `Minimum purchase of ${minPurchase.toLocaleString()} RWF required for this coupon`, 
          discountAmount: 0, 
          finalAmount: amount 
        };
      }

      // Calculate discount
      let discountAmount = 0;
      const discountValue = Number(coupon.discountValue);

      if (coupon.discountType === 'percentage') {
        discountAmount = (amount * discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
      } else {
        discountAmount = discountValue;
      }

      // Ensure discount doesn't exceed amount
      discountAmount = Math.min(discountAmount, amount);
      const finalAmount = Math.max(0, amount - discountAmount);

      return {
        isValid: true,
        coupon,
        discountAmount,
        finalAmount
      };
    } catch (error) {
      logger.error('Error validating coupon', { error });
      throw error;
    }
  }

  /**
   * Increments the usage count of a coupon
   */
  static async recordUsage(couponId: number): Promise<void> {
    try {
      await storage.incrementCouponUsage(couponId);
      logger.info('Coupon usage recorded', { couponId });
    } catch (error) {
      logger.error('Error recording coupon usage', { couponId, error });
    }
  }
}
