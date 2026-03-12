import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServerStatus } from '@prisma/client';

@Injectable()
export class SiteService {
  constructor(private prisma: PrismaService) {}

  async getSection(sectionName: string) {
    const row = await this.prisma.siteContent.findUnique({ where: { sectionName } });
    return row ? JSON.parse(row.contentJson) : null;
  }

  async getAllSections() {
    const rows = await this.prisma.siteContent.findMany();
    return rows.reduce((acc, row) => {
      acc[row.sectionName] = JSON.parse(row.contentJson);
      return acc;
    }, {} as Record<string, any>);
  }

  async upsertSection(sectionName: string, content: any) {
    return this.prisma.siteContent.upsert({
      where: { sectionName },
      create: { sectionName, contentJson: JSON.stringify(content) },
      update: { contentJson: JSON.stringify(content) },
    });
  }

  async getSettings() {
    return this.prisma.siteSetting.findFirst();
  }

  async updateSettings(data: any) {
    const existing = await this.prisma.siteSetting.findFirst();
    if (existing) {
      return this.prisma.siteSetting.update({ where: { id: existing.id }, data });
    }
    return this.prisma.siteSetting.create({ data });
  }

  async getLandingPlans() {
    const [coin, real] = await this.prisma.$transaction([
      this.prisma.planCoin.findMany({ orderBy: { coinPrice: 'asc' } }),
      this.prisma.planReal.findMany({ orderBy: { price: 'asc' } }),
    ]);
    return { coin, real };
  }

  async getFeatures() {
    return this.prisma.feature.findMany();
  }

  async getActivePopups() {
    return this.prisma.popupMessage.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPublicStats() {
    const [activeUsers, activeServers] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.server.count({ where: { status: ServerStatus.active } }),
    ]);
    return { activeUsers, activeServers, uptime: '99.9%' };
  }
}
