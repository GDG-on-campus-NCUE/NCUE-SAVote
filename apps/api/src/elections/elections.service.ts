import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import * as crypto from 'crypto';
import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { CreateEligibleVoterDto } from './dto/create-eligible-voter.dto';

@Injectable()
export class ElectionsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Internal check to prevent modification or deletion after an election starts.
   */
  private assertCanModifyElection(election: any) {
    const now = new Date();
    if (election.startTime && now >= new Date(election.startTime)) {
      throw new BadRequestException('Election has already started and cannot be modified or deleted');
    }
  }

  /**
   * Internal check to prevent viewing results before an election ends.
   */
  private assertCanViewResults(election: any) {
    const now = new Date();
    if (!election.endTime || now < new Date(election.endTime)) {
      throw new ForbiddenException('Results are sealed until the election ends');
    }
  }

  async create(dto: CreateElectionDto) {
    return this.prisma.election.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        config: dto.config,
        //merkleRoot: dto.merkleRootHash ?? null,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      } as any,
    });
  }

  async findAll() {
    return this.prisma.election.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException('Election not found');
    return election;
  }

  async update(id: string, dto: UpdateElectionDto) {
    const existing = await this.findOne(id);
    this.assertCanModifyElection(existing);
    return this.prisma.election.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        config: dto.config,
        //merkleRoot: dto.merkleRootHash ?? undefined,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      } as any,
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    this.assertCanModifyElection(existing);
    await this.prisma.election.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Enhanced result fetching with strict time check.
   */
  async getAdminSummary(id: string) {
    const election = await this.findOne(id);
    this.assertCanViewResults(election);

    // Original logic to fetch tally would go here or be called from votes service
    // This is a placeholder indicating that we perform the check BEFORE data retrieval
    return election;
  }

  async importEligibleVoters(electionId: string, dto: ImportEligibleVotersDto) {
    const election = await this.findOne(electionId);
    this.assertCanModifyElection(election);

    const lines = dto.csv.trim().split(/\r?\n/);

    // 💡 小提醒：如果 CreateEligibleVoterDto 報錯，請去那個 DTO 檔案裡加上 studentIdHash: string
    const voters: any[] = [];

    for (const line of lines) {
      const [studentId, className] = line.split(',').map((s) => s.trim());
      if (studentId && className) {

        // 👈 在這裡算出 Hash 值
        // (注意：請確保你的 elections.service 裡也有 hashStudentId 這個方法，沒有的話要從 voters.service 複製過來或做成共用工具)
        const studentIdHash = await this.hashStudentId(studentId);

        voters.push({
          studentId,
          class: className,
          electionId,
          studentIdHash // 👈 把算好的 Hash 塞進去
        });
      }
    }

    const created = await this.prisma.eligibleVoter.createMany({
      data: voters,
      skipDuplicates: true,
    });

    return { imported: created.count };
  }

  async listEligibleVoters(electionId: string) {
    return this.prisma.eligibleVoter.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async finalizeVoterList(electionId: string) {
    const election = await this.findOne(electionId);
    this.assertCanModifyElection(election);

    const voters = await this.prisma.eligibleVoter.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    });

    if (!voters.length) {
      throw new BadRequestException('No eligible voters to finalize');
    }

    // if (!election.merkleRoot) {
    //   throw new BadRequestException(
    //     'merkleRoot must be set before finalizing voter list',
    //   );
    // }

    return {
      success: true,
      totalVoters: voters.length,
    };
  }
  private hashStudentId(studentId: string): string {
    return crypto.createHash('sha256').update(studentId).digest('hex');
  }
}
