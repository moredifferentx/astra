import { Module, Global } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';
import { DiscordBotController } from './discord-bot.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [DiscordBotController],
  providers: [DiscordBotService],
  exports: [DiscordBotService],
})
export class DiscordBotModule {}
