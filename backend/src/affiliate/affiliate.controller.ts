import {
  Controller, Get, Post, Put, Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, MinLength, MaxLength } from 'class-validator';

class ApplyReferralDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  code: string;
}

@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  // ── Public settings (for frontend "coming soon" vs active) ──────────────────

  @Get('settings')
  getSettings() {
    return this.affiliateService.getSettings();
  }

  // ── User endpoints ──────────────────────────────────────────────────────────

  @Get('my-code')
  @UseGuards(JwtAuthGuard)
  getMyCode(@CurrentUser() user: any) {
    return this.affiliateService.getOrCreateReferralCode(user.id).then((code) => ({ code }));
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@CurrentUser() user: any) {
    return this.affiliateService.getReferralStats(user.id);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  applyReferral(@CurrentUser() user: any, @Body() dto: ApplyReferralDto) {
    return this.affiliateService.applyReferral(user.id, dto.code);
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  @Put('admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSettings(@Body() data: any) {
    return this.affiliateService.updateSettings(data);
  }
}
