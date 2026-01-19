import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CandidatesService } from './candidates.service';
import { ElectionsController } from './elections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VotesModule } from '../votes/votes.module';
import { VotersModule } from '../voters/voters.module';
import { MerkleModule } from '../merkle/merkle.module';

@Module({
  imports: [PrismaModule, VotesModule, VotersModule, MerkleModule],
  controllers: [ElectionsController],
  providers: [ElectionsService, CandidatesService],
})
export class ElectionsModule {}
