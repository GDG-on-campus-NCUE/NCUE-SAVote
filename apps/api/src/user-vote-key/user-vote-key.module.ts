import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserVoteKeyService } from './user-vote-key.service';
import { UserVoteKeyController } from './user-vote-key.controller';

@Module({
  imports: [PrismaModule], // 這裡一定要加，否則 Service 會找不到 PrismaService
  controllers: [UserVoteKeyController],
  providers: [UserVoteKeyService],
})
export class UserVoteKeyModule {}
