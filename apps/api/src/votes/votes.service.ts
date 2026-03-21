import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
//import { verifyVoteProof } from '@savote/crypto-lib';
import { bigIntToUuid } from '../utils/zk-utils';
import { randomBytes } from 'crypto';
import * as CryptoJS from 'crypto-js';
import { ElectionStatus } from '@prisma/client'; // 1. 確保有匯入 Enum
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

// @ts-ignore
import * as snarkjs from 'snarkjs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) { }
  private readonly logger = new Logger(VotesService.name);

  async submitVote(dto: SubmitVoteDto) {
    try {
      // 假設 publicSignals 的第一個元素就是 commitment
      const commitment = dto.publicSignals[0];
      this.logger.debug(`[ZK-DEBUG] Toll Request: Election=${dto.electionId}`);
      this.logger.debug(`[ZK-DEBUG] Commitment: ${commitment}`);

      if (!commitment) {
        throw new BadRequestException('Missing commitment in publicSignals');
      }

      // 2. Proof ZK
      const isValidProof = await this.verifyZk(dto.proof, dto.publicSignals);
      if (!isValidProof) {
        this.logger.error(` ZK Verfiy Error in Commitment: ${commitment}`);
        throw new BadRequestException('ZK_VERIFICATION_FAILED'); // 暫時改為報錯
        // this.logger.warn(`Invalid ZK proof received for commitment ${commitment}`);
        // // 為了防 Timing Attack，我們一樣回傳成功假象，但實際上不存檔
        // return { status: 'success', message: 'Vote submitted successfully' };
      }

      // 3. 用 commitment 找 UserVoteKey (我們不知道他是哪個學生)
      // 注意：這需要你在 Prisma schema 的 UserVoteKey 裡面，把 commitment 設為 @unique 或是加上 Index
      const voteKey = await this.prisma.userVoteKey.findFirst({
        where: {
          electionId: dto.electionId,
          commitment: commitment,
        },
      });

      if (!voteKey) {
        const existingKeys = await this.prisma.userVoteKey.findMany({
          where: { electionId: dto.electionId }
        });
        this.logger.warn(`No Correspond Commitment!`);
        this.logger.warn(`Exist Keys: ${existingKeys.map(k => k.commitment).join(', ')}`);
        this.logger.warn(`Commitment ${commitment} not found or already voted.`);
        // Debug
        throw new BadRequestException('COMMITMENT_NOT_FOUND_IN_DB');
        //return { status: 'success', message: 'Vote submitted successfully' }; // Fake msg
      }
      if (voteKey.hasVoted) {
        throw new BadRequestException('ALREADY_VOTED');
      }

      // 4. 寫入資料庫 (標記已投票 + 存入選票)
      await this.prisma.$transaction([
        // A. 沒收這把鑰匙
        this.prisma.userVoteKey.update({
          where: { id: voteKey.id },
          data: { hasVoted: true, votedAt: new Date() },
        }),
        // B. 存入選票 (這裡面絕對沒有 studentId 或 commitment)
        this.prisma.vote.create({
          data: {
            electionId: dto.electionId,
            voteContent: dto.voteContent,
            encryptKey: dto.encryptKey,
            proof: dto.proof as any, // 可選：如果你未來想做公開驗證，可以存 proof
          },
        }),
      ]);

      return { status: 'success', message: 'Vote submitted successfully' };
    } catch (error) {
      this.logger.error(`Failed to submit vote: ${error.message}`);
      // 統一回傳成功假象
      return { status: 'success', message: 'Vote submitted successfully' };
    }
  }

  // =============================================
  // Verify ZK. 
  // =============================================
  private async verifyZk(proof: any, publicSignals: any[]): Promise<boolean> {
    try {
      // 讀取你在後端準備好的 verification_key.json
      const vKeyPath = path.join(process.cwd(), 'src/zk/keys/verification_key.json');
      const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf-8'));

      // 呼叫 snarkjs 進行驗證
      const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return res;
    } catch (error) {
      this.logger.error(`ZK Verification error: ${error.message}`);
      return false;
    }
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
  // ABANDON-FUNCTION
  //  Gen the key from the Backend
  // =============================================
  // async getVoterCredential(userId: string, electionId: string) {
  //   // 1. find ID
  //   // Here need to modify
  //   const user = await this.prisma.user.findUnique({ where: { id: userId } });


  //   // 2. find key, if not, generate
  //   if (!user) throw new Error('User not found');
  //   const voteKey = await this.prisma.userVoteKey.findUnique({
  //     where: {

  //       hashedID_electionId: { hashedID: user.studentIdHash, electionId }
  //     }
  //   });

  //   // 3. group validation check
  //   if (!voteKey) throw new ForbiddenException('Do not in the valid group');
  //   //if (voteKey.hasVoted) throw new ForbiddenException('');


  //   // 4. generate a random encKey
  //   let currentEncryptKey = null;

  //   if (!currentEncryptKey) {
  //     // 產生 32 bytes (256-bit) 的隨機金鑰
  //     currentEncryptKey = randomBytes(32).toString('hex');
  //   }

  //   // 5. Send (EK,PK)
  //   return {
  //     secret: voteKey.secret,
  //     encryptKey: currentEncryptKey,
  //   };
  // }
}
