import { Module } from '@nestjs/common';
import { MerkleTreeService } from './merkle.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MerkleTreeService],
  exports: [MerkleTreeService],
})
export class MerkleModule {}
