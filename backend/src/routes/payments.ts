import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { config } from "../config";
import { CouponError, CouponService } from "../services/coupon";
import { authenticate } from "./authenticate";

function isRazorpayAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    statusCode?: number;
    error?: { code?: string; description?: string };
  };

  return maybeError.statusCode === 401
    || maybeError.error?.code === "BAD_REQUEST_ERROR"
    || maybeError.error?.description === "Authentication failed";
}

async function getRazorpayClient() {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    return null;
  }

  const Razorpay = (await import("razorpay")).default;
  return new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}

const adminCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().int().positive(),
  minAmount: z.number().int().positive().optional(),
  maxDiscount: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  validUntil: z.coerce.date().optional(),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.post("/api/payments/coupons/validate", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    try {
      const { code, amount } = z.object({
        code: z.string().min(1),
        amount: z.number().int().positive(),
      }).parse(request.body);

      const result = await CouponService.validateAndCalculate(code, amount, request.user.userId);
      return reply.send(result);
    } catch (error: any) {
      if (error instanceof CouponError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues[0].message });
      }
      if (isRazorpayAuthError(error)) {
        fastify.log.error({ error }, "Razorpay authentication failed while creating order");
        return reply.status(502).send({
          error: "Payment gateway authentication failed. Please verify Razorpay credentials.",
        });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  fastify.post("/api/payments/projects/:id/checkout", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    const razorpay = await getRazorpayClient();
    if (!razorpay) {
      return reply.status(503).send({ error: "Payments not configured" });
    }

    try {
      const { id } = request.params as { id: string };
      const { couponCode } = z.object({
        couponCode: z.string().optional(),
      }).parse(request.body ?? {});

      const originalAmount = 9900;
      let finalAmount = originalAmount;
      let discount = 0;
      let couponId: string | undefined;
      let discountPercentage = 0;

      if (couponCode) {
        const coupon = await CouponService.validateAndCalculate(
          couponCode,
          originalAmount,
          request.user.userId
        );
        finalAmount = coupon.finalAmount;
        discount = coupon.discount;
        couponId = coupon.couponId;
        discountPercentage = coupon.discountPercentage;
      }

      const receipt = `sl_${id.slice(0, 8)}_${Date.now().toString(36)}`;
      const order = await razorpay.orders.create({
        amount: finalAmount,
        currency: "INR",
        receipt,
        notes: {
          projectId: id,
          userId: request.user.userId,
          couponCode: couponCode || "none",
          originalAmount: originalAmount.toString(),
          discount: discount.toString(),
          couponId: couponId || "none",
        },
      });

      await prisma.payment.upsert({
        where: { razorpayOrderId: order.id },
        update: {},
        create: {
          userId: request.user.userId,
          razorpayOrderId: order.id,
          amount: finalAmount,
          currency: order.currency || "INR",
          status: "pending",
          projectId: id,
          planType: "paid_direct",
          description: "Premium upgrade for subdomain",
          couponCode: couponCode || null,
          discountAmount: discount,
        },
      });

      return reply.send({
        orderId: order.id,
        amount: order.amount,
        originalAmount,
        discount,
        discountPercentage,
        currency: order.currency,
        razorpayKeyId: config.RAZORPAY_KEY_ID,
        projectId: id,
        redirectUrl: `${config.FRONTEND_URL}/dashboard`,
        couponApplied: Boolean(couponCode),
      });
    } catch (error: any) {
      if (error instanceof CouponError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues[0].message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  fastify.post("/api/payments/verify-payment", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    const razorpay = await getRazorpayClient();
    if (!razorpay || !config.RAZORPAY_KEY_SECRET) {
      return reply.status(503).send({ error: "Payments not configured" });
    }

    try {
      const { orderId, paymentId, signature } = z.object({
        orderId: z.string().min(1),
        paymentId: z.string().min(1),
        signature: z.string().min(1),
      }).parse(request.body);

      const expectedSignature = crypto
        .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (expectedSignature !== signature) {
        return reply.status(400).send({ error: "Invalid payment signature" });
      }

      const order = await razorpay.orders.fetch(orderId);
      const payment = await razorpay.payments.fetch(paymentId);
      const discountAmount = Number(order.notes?.discount || 0);
      const couponId = order.notes?.couponId;

      let paymentMethod = payment.method || null;
      if (payment.method === "card" && payment.card) {
        paymentMethod = `${payment.card.network || "Card"} ${payment.card.type || ""} ****${payment.card.last4 || ""}`.trim();
      } else if (payment.method === "netbanking" && payment.bank) {
        paymentMethod = `Netbanking - ${payment.bank}`;
      } else if (payment.method === "wallet" && payment.wallet) {
        paymentMethod = `Wallet - ${payment.wallet}`;
      } else if (payment.method === "upi" && payment.vpa) {
        paymentMethod = `UPI - ${payment.vpa}`;
      }

      const amount = Number(order.amount);
      const gstRate = 0.18;
      const amountWithoutGst = Math.round(amount / (1 + gstRate));
      const gstAmount = amount - amountWithoutGst;

      await prisma.payment.upsert({
        where: { razorpayOrderId: orderId },
        update: {
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          status: "completed",
          paymentMethod,
          gstAmount,
          cgst: 0,
          sgst: 0,
          igst: gstAmount,
          completedAt: new Date(),
        },
        create: {
          userId: request.user.userId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          amount,
          currency: order.currency || "INR",
          status: "completed",
          projectId: order.notes?.projectId || null,
          planType: "paid_direct",
          description: `Premium upgrade for ${order.notes?.projectId ? "subdomain" : "account"}`,
          couponCode: order.notes?.couponCode !== "none" ? order.notes?.couponCode : null,
          discountAmount,
          paymentMethod,
          gstAmount,
          cgst: 0,
          sgst: 0,
          igst: gstAmount,
          completedAt: new Date(),
        },
      });

      if (couponId && couponId !== "none") {
        await CouponService.recordUsage(couponId, request.user.userId, orderId, discountAmount);
      }

      return reply.send({
        success: true,
        verified: true,
        payment: {
          id: paymentId,
          orderId,
          amount,
          currency: order.currency || "INR",
          method: paymentMethod,
          status: "completed",
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues[0].message });
      }
      if (isRazorpayAuthError(error)) {
        fastify.log.error({ error }, "Razorpay authentication failed while verifying payment");
        return reply.status(502).send({
          error: "Payment gateway authentication failed. Please verify Razorpay credentials.",
        });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  fastify.get("/api/payments/project/:projectId", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    const { projectId } = request.params as { projectId: string };

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: request.user.userId },
      select: { id: true },
    });

    if (!project) {
      return reply.status(404).send({ error: "Project not found or access denied" });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        projectId,
        status: "completed",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!payment) {
      return reply.send({ payment: null });
    }

    return reply.send({
      payment: {
        id: payment.id,
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.paymentMethod,
        planType: payment.planType,
        couponCode: payment.couponCode,
        discountAmount: payment.discountAmount,
        gstAmount: payment.gstAmount,
        cgst: payment.cgst,
        sgst: payment.sgst,
        igst: payment.igst,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      },
    });
  });

  fastify.post("/api/payments/admin/coupons", { preHandler: authenticate }, async (request, reply) => {
    try {
      const parsed = adminCouponSchema.parse(request.body);
      const coupon = await CouponService.createCoupon(parsed);
      return reply.status(201).send(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues[0].message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  fastify.get("/api/payments/admin/coupons", { preHandler: authenticate }, async (request, reply) => {
    const { activeOnly } = z.object({
      activeOnly: z.coerce.boolean().optional(),
    }).parse(request.query);

    return reply.send({
      coupons: await CouponService.listCoupons(activeOnly ?? false),
    });
  });

  fastify.patch("/api/payments/admin/coupons/:id/deactivate", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      return reply.send(await CouponService.deactivateCoupon(id));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.issues[0].message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
