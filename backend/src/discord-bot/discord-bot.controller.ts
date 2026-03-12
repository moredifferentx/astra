import { Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/discord-bot')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DiscordBotController {
  constructor(private botService: DiscordBotService) {}

  @Post('reconnect')
  @HttpCode(200)
  async reconnect() {
    await this.botService.reconnect();
    return { message: 'Discord bot reconnection triggered' };
  }
}
