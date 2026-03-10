import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  private async assertElectionNotStarted(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) throw new NotFoundException('Election not found');

    const now = new Date();
    if (election.startTime && now >= new Date(election.startTime)) {
      throw new BadRequestException('Election has already started. Candidates cannot be modified.');
    }
  }

  async create(electionId: string, dto: CreateCandidateDto) {
    await this.assertElectionNotStarted(electionId);
    return this.prisma.candidate.create({
      data: {
        ...dto,
        electionId,
      },
    });
  }

  async findAll(electionId: string) {
    return this.prisma.candidate.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto) {
    const candidate = await this.findOne(id);
    await this.assertElectionNotStarted(candidate.electionId);
    return this.prisma.candidate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const candidate = await this.findOne(id);
    await this.assertElectionNotStarted(candidate.electionId);
    await this.prisma.candidate.delete({
      where: { id },
    });
    return { success: true };
  }
}
