import { prisma } from "../db/prisma";

export interface AnalyticsSummary {
  totalVisits: number;
  last7Days: number;
  last30Days: number;
  lastVisitedAt: string | null;
  dailyStats: Array<{
    date: string;
    visits: number;
    uniqueVisits: number;
  }>;
}

interface VisitBuffer {
  totalVisits: number;
  uniqueIps: Set<string>;
  lastVisitedAt: Date;
}

class AnalyticsBuffer {
  private buffer = new Map<string, VisitBuffer>();
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 10_000;
  private readonly MAX_BUFFER_SIZE = 100;

  constructor() {
    this.startFlushInterval();
  }

  addVisit(projectId: string, ipAddress: string) {
    const existing = this.buffer.get(projectId);
    if (existing) {
      existing.totalVisits += 1;
      existing.uniqueIps.add(ipAddress);
      existing.lastVisitedAt = new Date();
    } else {
      this.buffer.set(projectId, {
        totalVisits: 1,
        uniqueIps: new Set([ipAddress]),
        lastVisitedAt: new Date(),
      });
    }

    if (this.buffer.size >= this.MAX_BUFFER_SIZE) {
      void this.flush();
    }
  }

  getPendingVisits(projectId: string) {
    return this.buffer.get(projectId)?.totalVisits ?? 0;
  }

  async flush() {
    if (this.buffer.size === 0) {
      return;
    }

    const snapshot = new Map(this.buffer);
    this.buffer.clear();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.allSettled(Array.from(snapshot.entries()).map(async ([projectId, data]) => {
      try {
        await prisma.$transaction([
          prisma.project.update({
            where: { id: projectId },
            data: {
              totalVisits: { increment: data.totalVisits },
              lastVisitedAt: data.lastVisitedAt,
            },
          }),
          prisma.analytics.upsert({
            where: {
              projectId_date: {
                projectId,
                date: today,
              },
            },
            create: {
              projectId,
              date: today,
              visits: data.totalVisits,
              uniqueVisits: data.uniqueIps.size,
            },
            update: {
              visits: { increment: data.totalVisits },
              uniqueVisits: { increment: data.uniqueIps.size },
            },
          }),
        ]);
      } catch (error) {
        console.error(`[ANALYTICS] Failed to flush visits for ${projectId}`, error);
      }
    }));
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }
}

export const analyticsBuffer = new AnalyticsBuffer();

export class AnalyticsService {
  async trackVisit(projectId: string, ipAddress: string) {
    analyticsBuffer.addVisit(projectId, ipAddress);
  }

  async getSummary(projectId: string): Promise<AnalyticsSummary> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        totalVisits: true,
        lastVisitedAt: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const analytics = await prisma.analytics.findMany({
      where: {
        projectId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    const pendingVisits = analyticsBuffer.getPendingVisits(projectId);
    const last7Days = analytics
      .filter((entry) => entry.date >= sevenDaysAgo)
      .reduce((total, entry) => total + entry.visits, 0);
    const last30Days = analytics.reduce((total, entry) => total + entry.visits, 0);

    return {
      totalVisits: project.totalVisits + pendingVisits,
      last7Days: last7Days + pendingVisits,
      last30Days: last30Days + pendingVisits,
      lastVisitedAt: project.lastVisitedAt?.toISOString() ?? null,
      dailyStats: analytics.map((entry) => ({
        date: entry.date.toISOString().split("T")[0],
        visits: entry.visits,
        uniqueVisits: entry.uniqueVisits,
      })),
    };
  }

  async getRecentAnalytics(projectId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const analytics = await prisma.analytics.findMany({
      where: {
        projectId,
        date: { gte: startDate },
      },
      orderBy: { date: "desc" },
    });

    return analytics.map((entry) => ({
      id: entry.id,
      projectId: entry.projectId,
      date: entry.date.toISOString().split("T")[0],
      visits: entry.visits,
      uniqueVisits: entry.uniqueVisits,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));
  }
}
