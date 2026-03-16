import { apiRequest } from "../lib/queryClient";
import { Coupon, InsertCoupon } from "@shared/schema";

export interface CouponValidationResponse {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  finalAmount: number;
  description?: string;
  discountType?: string;
  discountValue?: string;
}

export const CouponService = {
  /**
   * Validates a coupon code
   */
  async validateCoupon(code: string, amount: number, type: string): Promise<CouponValidationResponse> {
    return await apiRequest<CouponValidationResponse>(
      "/api/coupons/validate",
      {
        method: "POST",
        data: { code, amount, type },
      }
    );
  },

  /**
   * Fetches all coupons (Admin only)
   */
  async getAllCoupons(): Promise<Coupon[]> {
    return await apiRequest<Coupon[]>("/api/coupons/all");
  },

  /**
   * Fetches coupons with filters (Admin only)
   */
  async getCoupons(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<{ coupons: Coupon[]; total: number }> {
    const params = new URLSearchParams();
    if (options.page) params.append("page", options.page.toString());
    if (options.pageSize) params.append("pageSize", options.pageSize.toString());
    if (options.search) params.append("search", options.search);
    if (options.status) params.append("status", options.status);
    if (options.type) params.append("type", options.type);

    return await apiRequest<{ coupons: Coupon[]; total: number }>(`/api/coupons?${params.toString()}`);
  },

  /**
   * Creates a new coupon (Admin only)
   */
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    return await apiRequest<Coupon>("/api/coupons", {
      method: "POST",
      data: coupon,
    });
  },

  /**
   * Updates an existing coupon (Admin only)
   */
  async updateCoupon(id: number, coupon: Partial<Coupon>): Promise<Coupon> {
    return await apiRequest<Coupon>(`/api/coupons/${id}`, {
      method: "PATCH",
      data: coupon,
    });
  },

  /**
   * Deletes a coupon (Admin only)
   */
  async deleteCoupon(id: number): Promise<void> {
    await apiRequest(`/api/coupons/${id}`, {
      method: "DELETE",
    });
  }
};
