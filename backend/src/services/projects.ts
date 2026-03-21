import { HostingPlatform, Plan } from '@prisma/client';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { CloudflareClient } from './cloudflare';
import { isSupportedPlatformUrl } from '../lib/platforms';

export class ProjectService {
  private readonly cloudflare = new CloudflareClient();

  async create(userId: string, data: {
    subdomain: string;
    targetUrl: string;
    hostingPlatform?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    if (!user.emailVerified) {
      throw new Error('Email verification required');
    }

    // Check if subdomain is available
    const existing = await prisma.project.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existing) {
      throw new Error('Subdomain already taken');
    }

    return prisma.project.create({
      data: {
        ownerId: userId,
        subdomain: data.subdomain,
        targetUrl: data.targetUrl,
        plan: Plan.free_proxy,
        hostingPlatform: data.hostingPlatform as HostingPlatform | undefined,
      },
    });
  }

  async list(userId: string) {
    return prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  async update(projectId: string, userId: string, data: {
    targetUrl?: string;
    hostingPlatform?: string;
  }) {
    const project = await this.get(projectId, userId);

    if (project.plan === Plan.paid_direct && data.targetUrl && !isSupportedPlatformUrl(data.targetUrl)) {
      throw new Error('Paid projects must point to a supported hosting platform');
    }

    const updateData = {
      ...data,
      hostingPlatform: data.hostingPlatform as HostingPlatform | undefined,
    };

    return prisma.project.update({
      where: { id: project.id },
      data: updateData,
    });
  }

  async delete(projectId: string, userId: string) {
    const project = await this.get(projectId, userId);

     if (project.plan === Plan.paid_direct && project.dnsRecordId) {
      try {
        await this.cloudflare.deleteRecord(project.dnsRecordId);
      } catch (error) {
        console.error('[PROJECTS] Failed to delete Cloudflare record', error);
      }
    }

    await prisma.project.delete({
      where: { id: project.id },
    });
  }

  async resolve(subdomain: string) {
    return prisma.project.findUnique({
      where: { subdomain },
    });
  }

  async incrementVisits(subdomain: string) {
    try {
      await prisma.project.update({
        where: { subdomain },
        data: {
          totalVisits: { increment: 1 },
          lastVisitedAt: new Date(),
        },
      });
    } catch (error) {
      // Silently fail if project doesn't exist
    }
  }

  async upgrade(projectId: string, userId: string, data: { hostingPlatform?: string }) {
    const project = await this.get(projectId, userId);

    if (project.plan === Plan.paid_direct) {
      return project;
    }
    if (!isSupportedPlatformUrl(project.targetUrl)) {
      throw new Error('Upgrade is only available for supported platforms');
    }

    let dnsRecordId: string | undefined;
    if (config.CLOUDFLARE_API_TOKEN && config.CLOUDFLARE_ZONE_ID) {
      const fqdn = `${project.subdomain}.${config.BASE_DOMAIN}`;
      const targetHost = new URL(project.targetUrl).host;
      const record = await this.cloudflare.createCnameRecord({
        name: fqdn,
        target: targetHost,
        proxied: false,
        ttl: 300,
      });
      dnsRecordId = record.id;
    }

    return prisma.project.update({
      where: { id: project.id },
      data: {
        plan: Plan.paid_direct,
        dnsRecordId,
        hostingPlatform: data.hostingPlatform as HostingPlatform | undefined,
      },
    });
  }
}
