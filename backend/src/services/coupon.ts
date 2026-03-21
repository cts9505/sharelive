import { prisma } from "../db/prisma";

export class CouponError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

export class CouponService {
  static async validateAndCalculate(code: string, originalAmount: number, userId: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: { userId },
        },
      },
    });

    if (!coupon) {
      throw new CouponError("Invalid coupon code");
    }

    const now = new Date();
    if (!coupon.isActive) {
      throw new CouponError("Coupon is no longer active");
    }
    if (coupon.validFrom > now) {
      throw new CouponError("Coupon is not yet valid");
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new CouponError("Coupon has expired");
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new CouponError("Coupon usage limit reached");
    }
    if (coupon.usages.length > 0) {
      throw new CouponError("You have already used this coupon");
    }
    if (coupon.minAmount && originalAmount < coupon.minAmount) {
      throw new CouponError(`Minimum order amount of Rs.${coupon.minAmount / 100} required`);
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.floor((originalAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, originalAmount);

    return {
      valid: true,
      discount,
      finalAmount: originalAmount - discount,
      couponId: coupon.id,
      discountPercentage: Math.round((discount / originalAmount) * 100),
    };
  }

  static async recordUsage(couponId: string, userId: string, orderId: string, discount: number) {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
          discount,
        },
      }),
      prisma.coupon.update({
        where: { id: couponId },
        data: {
          usageCount: { increment: 1 },
        },
      }),
    ]);
  }

  static async createCoupon(data: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validUntil?: Date;
  }) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        minAmount: data.minAmount,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        validUntil: data.validUntil,
        isActive: true,
      },
    });
  }

  static async listCoupons(activeOnly = false) {
    return prisma.coupon.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async deactivateCoupon(couponId: string) {
    return prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: false },
    });
  }
}
