import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { CreateEligibleVoterDto } from './dto/create-eligible-voter.dto';

@Injectable()
export class ElectionsService {
    constructor(private prisma: PrismaService) { }

    private assertCanModifyElection(status: string) {
        if (status === 'VOTING_OPEN' || status === 'VOTING_CLOSED' || status === 'TALLIED') {
            throw new BadRequestException('Election can no longer be modified');
        }
    }

    async create(dto: CreateElectionDto) {
        return this.prisma.election.create({
            data: {
                name: dto.name,
                merkleRoot: dto.merkleRootHash ?? null,
                status: dto.status ?? 'DRAFT',
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
        this.assertCanModifyElection(existing.status as string);
        return this.prisma.election.update({
            where: { id },
            data: {
                ...dto,
                merkleRoot: dto.merkleRootHash ?? undefined,
                startTime: dto.startTime ? new Date(dto.startTime) : undefined,
                endTime: dto.endTime ? new Date(dto.endTime) : undefined,
            } as any,
        });
    }

    async remove(id: string) {
        const existing = await this.findOne(id);
        this.assertCanModifyElection(existing.status as string);
        await this.prisma.election.delete({ where: { id } });
        return { success: true };
    }

    async importEligibleVoters(electionId: string, dto: ImportEligibleVotersDto) {
        // Parse CSV: expect columns studentId,class
        const lines = dto.csv.trim().split(/\r?\n/);
        const voters: CreateEligibleVoterDto[] = [];
        for (const line of lines) {
            const [studentId, className] = line.split(',').map(s => s.trim());
            if (studentId && className) {
                voters.push({ studentId, class: className, electionId });
            }
        }
        // Bulk create, skip duplicates
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
        const election = await this.prisma.election.findUnique({ where: { id: electionId } });
        if (!election) throw new NotFoundException('Election not found');

        if (election.status === 'VOTING_OPEN' || election.status === 'VOTING_CLOSED' || election.status === 'TALLIED') {
            throw new BadRequestException('Election already started or finished');
        }

        const voters = await this.prisma.eligibleVoter.findMany({
            where: { electionId },
            orderBy: { createdAt: 'asc' },
        });

        if (!voters.length) {
            throw new BadRequestException('No eligible voters to finalize');
        }

        // merkleRoot is expected to be pre-computed and set on election via update
        if (!election.merkleRoot) {
            throw new BadRequestException('merkleRoot must be set before finalizing voter list');
        }

        const updated = await this.prisma.election.update({
            where: { id: electionId },
            data: {
                status: 'VOTING_OPEN',
            } as any,
        });

        return {
            success: true,
            election: updated,
            totalVoters: voters.length,
        };
    }
}
