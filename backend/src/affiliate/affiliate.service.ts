import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.affiliateSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  async updateSettings(data: {
    enabled?: boolean;
    commissionPercent?: number;
    discountPercent?: number;
    discordClaimRequired?: boolean;
    discordServerUrl?: string;
  }) {
    const { enabled, commissionPercent, discountPercent, discordClaimRequired, discordServerUrl } = data;
    const clean = {
      ...(enabled !== undefined && { enabled }),
      ...(commissionPercent !== undefined && { commissionPercent }),
      ...(discountPercent !== undefined && { discountPercent }),
      ...(discordClaimRequired !== undefined && { discordClaimRequired }),
      ...(discordServerUrl !== undefined && { discordServerUrl }),
    };
    return this.prisma.affiliateSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...clean },
      update: clean,
    });
  }

  async getOrCreateReferralCode(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;

    const code = randomBytes(6).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }

  async getReferralStats(userId: number) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        commissionEarned: true,
        planName: true,
        createdAt: true,
        referred: { select: { email: true } },
      },
    });

    const totalEarned = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);

    return {
      referralCount: referrals.length,
      totalEarned: Math.round(totalEarned * 100) / 100,
      referrals: referrals.map((r) => ({
        id: r.id,
        email: r.referred.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        commissionEarned: r.commissionEarned,
        planName: r.planName,
        date: r.createdAt,
      })),
    };
  }

  async applyReferral(referredUserId: number, referralCode: string) {
    const settings = await this.getSettings();
    if (!settings.enabled) throw new BadRequestException('Affiliate program is not active');

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });
    if (!referrer) throw new BadRequestException('Invalid referral code');
    if (referrer.id === referredUserId) throw new BadRequestException('Cannot refer yourself');

    // Check if this user already has a referrer
    const user = await this.prisma.user.findUnique({ where: { id: referredUserId } });
    if (user?.referredBy) throw new BadRequestException('You already have a referral applied');

    await this.prisma.user.update({
      where: { id: referredUserId },
      data: { referredBy: referrer.id },
    });

    return { message: 'Referral linked! You will get discounts and your referrer earns commission on your paid purchases.' };
  }

  /**
   * Called when a referred user purchases a paid plan.
   * Awards commission to the referrer as balance credit.
   */
  async recordPurchaseCommission(buyerUserId: number, planPrice: number, planName: string) {
    const settings = await this.getSettings();
    if (!settings.enabled || settings.commissionPercent <= 0) return;

    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { referredBy: true },
    });
    if (!buyer?.referredBy) return;

    const commission = Math.round(planPrice * (settings.commissionPercent / 100) * 100) / 100;
    if (commission <= 0) return;

    await this.prisma.$transaction([
      this.prisma.referral.create({
        data: {
          referrerId: buyer.referredBy,
          referredId: buyerUserId,
          commissionEarned: commission,
          planName,
        },
      }),
      this.prisma.user.update({
        where: { id: buyer.referredBy },
        data: { balance: { increment: commission } },
      }),
    ]);
  }

  /**
   * Returns the discount percent for a referred user (0 if not referred or disabled).
   */
  async getReferralDiscount(userId: number): Promise<number> {
    const settings = await this.getSettings();
    if (!settings.enabled || settings.discountPercent <= 0) return 0;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true },
    });
    if (!user?.referredBy) return 0;

    return settings.discountPercent;
  }
}
