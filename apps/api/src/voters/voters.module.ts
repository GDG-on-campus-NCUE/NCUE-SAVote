import { Module } from '@nestjs/common';
import { VotersService } from './voters.service';
import { VotersController } from './voters.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [VotersService],
  controllers: [VotersController],
  exports: [VotersService],
})
export class VotersModule {}
