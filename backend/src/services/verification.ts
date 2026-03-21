import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { config } from "../config";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from "../lib/emailTemplates";
import { sendMail } from "../lib/mailer";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = () => crypto.randomBytes(32).toString("hex");

export class VerificationService {
  async sendEmailVerification(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true, fullName: true },
    });

    if (!user) {
      throw new Error("User not found");
    }
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    const otp = generateOtp();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId,
        token: `${token}:${otp}`,
        type: "email",
        expiresAt,
      },
    });

    await sendMail({
      to: user.email,
      subject: "Verify Your Email - ShareLive",
      html: EMAIL_VERIFY_TEMPLATE(user.fullName || "User", user.email, otp, `${config.FRONTEND_URL}/verify-email?token=${token}`),
    });

    return { message: "Verification email sent", expiresIn: 600 };
  }

  async verifyEmailToken(token: string) {
    const candidates = await prisma.verificationToken.findMany({
      where: {
        type: "email",
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    });

    const verificationToken = candidates.find((entry) => entry.token.startsWith(`${token}:`) || entry.token === token);
    if (!verificationToken) {
      throw new Error("Invalid or expired token");
    }

    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await sendMail({
      to: verificationToken.user.email,
      subject: "Welcome to ShareLive",
      html: WELCOME_EMAIL_TEMPLATE(verificationToken.user.fullName || "User"),
    });

    return { message: "Email verified successfully" };
  }

  async verifyEmailOtp(userId: string, otp: string) {
    const candidates = await prisma.verificationToken.findMany({
      where: {
        userId,
        type: "email",
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    });

    const verificationToken = candidates.find((entry) => entry.token.endsWith(`:${otp}`));
    if (!verificationToken) {
      throw new Error("Invalid or expired OTP");
    }

    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await sendMail({
      to: verificationToken.user.email,
      subject: "Welcome to ShareLive",
      html: WELCOME_EMAIL_TEMPLATE(verificationToken.user.fullName || "User"),
    });

    return { message: "Email verified successfully" };
  }

  async sendPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return { message: "If the email exists, a reset code has been sent" };
    }

    const otp = generateOtp();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { userId: user.id, type: "password_reset" },
    });

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: `${token}:${otp}`,
        type: "password_reset",
        expiresAt,
      },
    });

    await sendMail({
      to: email,
      subject: "Reset Your Password - ShareLive",
      html: PASSWORD_RESET_TEMPLATE(user.fullName || "User", otp, `${config.FRONTEND_URL}/forgot-password?token=${token}`),
    });

    return { message: "Reset code sent to your email" };
  }

  async verifyResetOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Invalid email or OTP");
    }

    const candidates = await prisma.verificationToken.findMany({
      where: {
        userId: user.id,
        type: "password_reset",
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    const verificationToken = candidates.find((entry) => entry.token.endsWith(`:${otp}`));
    if (!verificationToken) {
      throw new Error("Invalid or expired OTP");
    }

    const resetToken = generateToken();
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: {
        token: `${resetToken}:verified`,
      },
    });

    return {
      message: "OTP verified",
      resetToken,
    };
  }

  async resetPassword(email: string, resetToken: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Invalid request");
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: "password_reset",
        token: `${resetToken}:verified`,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!verificationToken) {
      throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Password reset successfully" };
  }
}
