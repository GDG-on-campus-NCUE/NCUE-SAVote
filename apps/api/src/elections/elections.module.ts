import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CandidatesService } from './candidates.service';
import { ElectionsController } from './elections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [PrismaModule, VotesModule],
  controllers: [ElectionsController],
  providers: [ElectionsService, CandidatesService],
})
export class ElectionsModule {}
