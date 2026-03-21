import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserVoteKeyDto } from './dto/create-user-vote-key.dto';
import { UpdateUserVoteKeyDto } from './dto/update-user-vote-key.dto';

@Injectable()
export class UserVoteKeyService {
  // 這裡就是注入魔法：讓 service 擁有 db 操作能力
  constructor(private prisma: PrismaService) { }

  async findOneByHashedId(hashedId: string, electionId: string) {
    return this.prisma.userVoteKey.findUnique({
      where: {
        hashedID_electionId: { // 這是 Prisma 針對 @@unique 自動生成的複合鍵名稱
          hashedID: hashedId,
          electionId: electionId,
        },
      },
    });
  }
  // Abandon Function
  // async getAccessKey(userId: string, electionId: string) {
  //   // 1. 取得使用者的 studentIdHash (作為 hashedID)
  //   const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
  //   if(!user){
  //     throw new ForbiddenException('No user found');
  //   }
  //   if (user.studentIdHash == null){
  //     throw new ForbiddenException('The ID is not exist');
  //   }

  //   // 2. 檢查是否已經存在 key
  //   let voteKey = await this.prisma.userVoteKey.findUnique({
  //     where: {
  //       hashedID_electionId: {
  //         hashedID: user.studentIdHash,
  //         electionId: electionId,
  //       },
  //     },
  //   });

  //   if (voteKey == null) {
  //     throw new ForbiddenException('Key Not exist');
  //   }

  //   //==========================
  //   // Revote Checking
  //   //==========================
  //   // If accept revote, here need to modify
  //   if (voteKey?.hasVoted) {
  //     throw new ForbiddenException('You have already cast your vote.');
  //   }

  //   // 4. 如果還沒投過票，回傳 PK/VK
  //   // (如果不存在則建立，這部分視你的 ZK 電路預產機制而定)
  //   return {
  //     secret: voteKey.secret,
  //     commitment: voteKey.commitment,
  //   };
  // }
}
