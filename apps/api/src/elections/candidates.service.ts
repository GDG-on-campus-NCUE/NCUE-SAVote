import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async create(electionId: string, dto: CreateCandidateDto) {
    // Verify election exists
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

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
    await this.findOne(id); // Ensure exists
    return this.prisma.candidate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    await this.prisma.candidate.delete({
      where: { id },
    });
    return { success: true };
  }
}
