import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticate, AuthenticatedRequest } from './authenticate';
import { VerificationService } from '../services/verification';

const profileBodySchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  addressLine1: z.string().trim().max(255).optional(),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/).optional().or(z.literal("")),
  newsletterSubscribed: z.boolean().optional(),
});

const subscribeSchema = z.object({
  email: z.string().email(),
});

const onboardingSchema = profileBodySchema.extend({
  fullName: z.string().trim().min(1).max(120),
  newsletterSubscribed: z.boolean().default(false),
});

const verifyEmailSchema = z.object({
  otp: z.string().length(6),
});

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  emailVerified: true,
  phoneVerified: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  occupation: true,
  companyName: true,
  gstin: true,
  newsletterSubscribed: true,
  onboardingCompleted: true,
  createdAt: true,
} as const;

const verificationService = new VerificationService();

function emptyToNull(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === '' ? null : value;
}

export async function usersRoutes(fastify: FastifyInstance) {
  const profilePaths = ['/users/profile', '/api/users/profile'];
  const paymentsPaths = ['/users/payments', '/api/users/payments'];
  const subscribePaths = ['/users/subscribe', '/api/users/subscribe'];
  const onboardingPaths = ['/users/onboarding', '/api/users/onboarding'];
  const onboardingStatusPaths = ['/users/onboarding/status', '/api/users/onboarding/status'];
  const verifySendPaths = ['/users/verify/email/send', '/api/users/verify/email/send'];
  const verifyTokenPaths = ['/users/verify/email', '/api/users/verify/email'];
  const verifyOtpPaths = ['/users/verify/email/otp', '/api/users/verify/email/otp'];

  for (const path of subscribePaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = subscribeSchema.parse(request.body);
        const user = await prisma.user.findUnique({
          where: { email: parsed.email.toLowerCase() },
          select: { id: true, newsletterSubscribed: true },
        });

        if (!user) {
          return reply.status(404).send({
            error: 'Email not found',
            message: 'This email is not registered. Please create an account first to subscribe to our newsletter.',
            needsAccount: true,
          });
        }

        if (user.newsletterSubscribed) {
          return reply.send({
            success: true,
            message: 'You are already subscribed to our newsletter!',
            alreadySubscribed: true,
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { newsletterSubscribed: true },
        });

        return reply.send({
          success: true,
          message: 'Successfully subscribed to ShareLive newsletter! You will receive product updates and announcements.',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.issues[0].message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of profilePaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: profileSelect,
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send(user);
    });

    fastify.put(path, { preHandler: authenticate }, async (request, reply) => {
      const parsed = profileBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      const userId = (request as AuthenticatedRequest).user.userId;

      try {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fullName: emptyToNull(parsed.data.fullName),
            phoneNumber: emptyToNull(parsed.data.phoneNumber),
            phoneVerified: true,
            addressLine1: emptyToNull(parsed.data.addressLine1),
            addressLine2: emptyToNull(parsed.data.addressLine2),
            city: emptyToNull(parsed.data.city),
            state: emptyToNull(parsed.data.state),
            country: emptyToNull(parsed.data.country),
            postalCode: emptyToNull(parsed.data.postalCode),
            occupation: emptyToNull(parsed.data.occupation),
            companyName: emptyToNull(parsed.data.companyName),
            gstin: emptyToNull(parsed.data.gstin),
            newsletterSubscribed: parsed.data.newsletterSubscribed,
          },
          select: profileSelect,
        });

        return reply.send({ user: updatedUser });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          return reply.status(409).send({ error: 'A unique profile field is already in use' });
        }

        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of paymentsPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.userId;
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          amount: true,
          currency: true,
          status: true,
          planType: true,
          description: true,
          couponCode: true,
          discountAmount: true,
          paymentMethod: true,
          failureReason: true,
          gstAmount: true,
          cgst: true,
          sgst: true,
          igst: true,
          createdAt: true,
          completedAt: true,
          projectId: true,
        },
      });

      const projectIds = payments
        .map((payment) => payment.projectId)
        .filter((projectId): projectId is string => Boolean(projectId));

      const projects = projectIds.length === 0
        ? []
        : await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, subdomain: true },
          });

      const subdomainByProjectId = new Map(projects.map((project) => [project.id, project.subdomain]));

      return reply.send({
        payments: payments.map((payment) => ({
          ...payment,
          projectSubdomain: payment.projectId ? subdomainByProjectId.get(payment.projectId) ?? null : null,
        })),
      });
    });
  }

  for (const path of onboardingPaths) {
    fastify.post(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const parsed = onboardingSchema.parse(request.body);
        const userId = (request as AuthenticatedRequest).user.userId;

        const existingGstin = parsed.gstin
          ? await prisma.user.findFirst({
              where: {
                gstin: parsed.gstin,
                id: { not: userId },
              },
            })
          : null;

        if (existingGstin) {
          return reply.status(400).send({ error: 'GSTIN already registered' });
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fullName: parsed.fullName,
            phoneNumber: emptyToNull(parsed.phoneNumber),
            phoneVerified: true,
            addressLine1: emptyToNull(parsed.addressLine1),
            addressLine2: emptyToNull(parsed.addressLine2),
            city: emptyToNull(parsed.city),
            state: emptyToNull(parsed.state),
            country: emptyToNull(parsed.country),
            postalCode: emptyToNull(parsed.postalCode),
            occupation: emptyToNull(parsed.occupation),
            companyName: emptyToNull(parsed.companyName),
            gstin: emptyToNull(parsed.gstin),
            newsletterSubscribed: parsed.newsletterSubscribed,
            onboardingCompleted: true,
            onboardingStep: 6,
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            emailVerified: true,
            phoneVerified: true,
            onboardingCompleted: true,
          },
        });

        return reply.send({
          message: 'Onboarding completed successfully',
          user: updatedUser,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid data', details: error.issues });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of onboardingStatusPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          emailVerified: true,
          phoneVerified: true,
          onboardingCompleted: true,
          onboardingStep: true,
          addressLine1: true,
          city: true,
          state: true,
          country: true,
          occupation: true,
          companyName: true,
          gstin: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ user });
    });
  }

  for (const path of verifySendPaths) {
    fastify.post(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        return reply.send(await verificationService.sendEmailVerification((request as AuthenticatedRequest).user.userId));
      } catch (error: any) {
        return reply.status(400).send({ error: error.message || 'Failed to send verification email' });
      }
    });
  }

  for (const path of verifyTokenPaths) {
    fastify.get(path, async (request, reply) => {
      try {
        const { token } = z.object({ token: z.string().min(32) }).parse(request.query);
        return reply.send(await verificationService.verifyEmailToken(token));
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid token format' });
        }
        return reply.status(400).send({ error: error instanceof Error ? error.message : 'Verification failed' });
      }
    });
  }

  for (const path of verifyOtpPaths) {
    fastify.post(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const parsed = verifyEmailSchema.parse(request.body);
        return reply.send(await verificationService.verifyEmailOtp((request as AuthenticatedRequest).user.userId, parsed.otp));
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.issues[0].message });
        }
        return reply.status(400).send({ error: error instanceof Error ? error.message : 'Verification failed' });
      }
    });
  }
}
