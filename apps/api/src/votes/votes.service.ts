import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
//import { verifyVoteProof } from '@savote/crypto-lib';
import { bigIntToUuid } from '../utils/zk-utils';
import { randomBytes } from 'crypto';
import * as CryptoJS from 'crypto-js';
import { ElectionStatus } from '@prisma/client'; // 1. 確保有匯入 Enum
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Injectable()
export class VotesService {
  logger: any;
  constructor(private prisma: PrismaService) { }

  async submitVote(dto: SubmitVoteDto, userId: string) {
    // 1. Revoting check
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.studentIdHash == null){
      return;
    }
    const voteKey = await this.prisma.userVoteKey.findUnique({
      where: {
        hashedID_electionId: {
          hashedID: user?.studentIdHash,
          electionId: dto.electionId
        }
      }
    });

    if (!voteKey || voteKey.hasVoted) {
      this.logger.warn(`${userId} tried to revote`);
      // Fake msg
      return { status: 'success', message: 'Vote submitted successfully' };
    }

    // 2. ZK, Vaidation check功
    const isValid = await this.verifyZk(dto.proof, dto.publicSignals);
    if (!isValid) {
      // Fake msg
      return { status: 'success', message: 'Vote submitted successfully' };
    }

    // 3. Write into database
    await this.prisma.$transaction([
      // A. Mark Key as used
      this.prisma.userVoteKey.update({
        where: { id: voteKey.id },
        data: { hasVoted: true, votedAt: new Date() }
      }),
      // B. Save the vote without recording
      this.prisma.vote.create({
        data: {
          electionId: dto.electionId,
          voteContent: dto.voteContent,
          encryptKey: dto.encryptKey,
          proof: dto.proof,
          publicSignals: dto.publicSignals
        }
      })
    ]);

    return { status: 'success', message: 'Vote submitted successfully' };
  }

  // =============================================
  // Verify ZK. 
  // Not finished.
  // =============================================
  private async verifyZk(proof: any, publicSignals: any[]): Promise<boolean> {
    return true; // 先讓所有票都通過，等電路調好再來接 snarkjs
  }

  // 輔助方法：載入對應選舉的 VK
  private async loadVerificationKey(electionId: string) {
    // 這裡可以從檔案系統讀取，或是從資料庫的 Election 表拿
    // return JSON.parse(fs.readFileSync(`keys/${electionId}_vkey.json`, 'utf8'));
  }
  
  // Trigger the finish of election
  async getTally(electionId: string) {
    // 1. 檢查選舉是否已經結束，避免重複統計
    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (election?.status == ElectionStatus.FINISHED) {
      throw new BadRequestException('Already tallied this election');
    }
  
    // 2. 呼叫你的 private 統計邏輯
    const tallyData = await this.performTally(electionId);
  
    // 3. 將結果寫回資料庫，並標記為結束
    await this.prisma.election.update({
      where: { id: electionId },
      data: {
        status: ElectionStatus.FINISHED,
        finalResult: tallyData.results, // 直接存入 JSON 欄位
      },
    });
  
    return { message: '統計完成', result: tallyData.results };
  }

  // ================================== 
  // Tally the vote when the elections are finished.
  // ==================================
  private async performTally(electionId: string) {
    // 1. Select all votes in the same election
    const votes = await this.prisma.vote.findMany({
      where: { electionId },
      select: {
        voteContent: true,
        encryptKey: true,
      },
    });
  
    const results: Record<string, number> = {};
  
    // 2. Accumulation
    for (const vote of votes) {
      try {
        const bytes = CryptoJS.AES.decrypt(vote.voteContent, vote.encryptKey || '');
        const decryptedContent = bytes.toString(CryptoJS.enc.Utf8);
  
        if (decryptedContent) {
          results[decryptedContent] = (results[decryptedContent] || 0) + 1;
        }

      } catch (error) {
        this.logger.error(`Error: ${error.message}`);
      }
    }
  
    return {
      electionId,
      totalVotes: votes.length,
      results, 
    };
  }

  // =============================================
  // 
  // =============================================
  async getVoterCredential(userId: string, electionId: string) {
    // 1. find ID
    // Here need to modify
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    
    // 2. find key, if not, generate
    if (!user) throw new Error('User not found');
    const voteKey = await this.prisma.userVoteKey.findUnique({
      where: {
        
        hashedID_electionId: { hashedID: user.studentIdHash, electionId }
      }
    });

    // 3. group validation check
    if (!voteKey) throw new ForbiddenException('Do not in the valid group');
    //if (voteKey.hasVoted) throw new ForbiddenException('');


    // 4. generate a random encKey
    let currentEncryptKey = null;

    if (!currentEncryptKey) {
      // 產生 32 bytes (256-bit) 的隨機金鑰
      currentEncryptKey = randomBytes(32).toString('hex');
    }

    // 5. Send (EK,PK)
    return {
      proveKey: voteKey.proveKey,
      encryptKey: currentEncryptKey,
    };
  }
}
