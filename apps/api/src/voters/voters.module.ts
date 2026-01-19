import { Module } from '@nestjs/common';
import { VotersService } from './voters.service';
import { VotersController } from './voters.controller';
import { AuthModule } from '../auth/auth.module';
import { MerkleModule } from '../merkle/merkle.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, MerkleModule, PrismaModule],
  providers: [VotersService],
  controllers: [VotersController],
  exports: [VotersService],
})
export class VotersModule {}
