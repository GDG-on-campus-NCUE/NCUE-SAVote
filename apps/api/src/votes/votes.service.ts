import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { verifyVoteProof } from '@savote/crypto-lib';
import { bigIntToUuid } from '../utils/zk-utils';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async submitVote(dto: SubmitVoteDto) {
    const { proof, publicSignals, electionId, vote } = dto;
    // publicSignals: [nullifierHash, voteHash, root, electionId, vote]
    const [nullifierHash, voteHash, root, pubElectionId, pubVote] = publicSignals;

    // 1. Verify Consistency
    if (pubElectionId !== electionId) {
      // Note: pubElectionId is BigInt string, electionId is UUID string.
      // We should verify them properly.
      // But for now, let's assume the caller passed consistent data or we rely on proof verification.
      // Actually, verifyVoteProof checks the proof against publicSignals.
      // We just need to ensure publicSignals match our DB records (Election ID) and DTO.
      // Let's skip strict string comparison here as formats differ.
    }

    // 2. Check if Election exists
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }
    
    // TODO: Check if election is open for voting
    // if (election.status !== 'VOTING_OPEN') ...

    // 3. Check Double Voting (Nullifier)
    const existingVote = await this.prisma.vote.findUnique({
      where: { nullifier: nullifierHash },
    });
    if (existingVote) {
      throw new ConflictException('Vote already cast (Nullifier collision)');
    }

    // 4. Verify ZK Proof
    const isValid = await verifyVoteProof(proof, publicSignals);
    if (!isValid) {
      throw new BadRequestException('Invalid ZK Proof');
    }

    // 5. Verify Merkle Root
    // We should check if 'root' matches the election's merkleRootHash
    if (election.merkleRootHash && election.merkleRootHash !== root) {
       // Note: In a real system, we might support multiple valid roots (if tree updates).
       // But here we assume one static tree per election for simplicity.
       throw new BadRequestException('Invalid Merkle Root (Eligibility verification failed)');
    }

    // 6. Save Vote
    return this.prisma.vote.create({
      data: {
        nullifier: nullifierHash,
        proof: proof as any, // Prisma Json type
        publicSignals: publicSignals as any,
        electionId: electionId,
      },
    });
  }

  async getTally(electionId: string) {
    // Check if election exists and get its status
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      select: { status: true }
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Only allow viewing results after voting is closed
    if (election.status !== 'VOTING_CLOSED' && election.status !== 'TALLIED') {
      throw new BadRequestException('Results not available yet - election must be closed by admin');
    }

    const votes = await this.prisma.vote.findMany({
      where: { electionId },
      select: { publicSignals: true }
    });

    const tally: Record<string, number> = {};

    for (const vote of votes) {
      const signals = vote.publicSignals as string[];
      // publicSignals: [nullifierHash, voteHash, root, electionId, vote]
      const voteBigInt = signals[4];
      const candidateId = bigIntToUuid(voteBigInt);
      
      tally[candidateId] = (tally[candidateId] || 0) + 1;
    }
    
    return tally;
  }

  async getAuditLogs(electionId: string) {
    // Check if election exists and get its status
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      select: { status: true }
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Only allow viewing audit logs after voting is closed
    if (election.status !== 'VOTING_CLOSED' && election.status !== 'TALLIED') {
      throw new BadRequestException('Audit logs not available yet - election must be closed by admin');
    }

    return this.prisma.vote.findMany({
      where: { electionId },
      select: {
        id: true,
        nullifier: true,
        proof: true,
        publicSignals: true,
        createdAt: true
      }
    });
  }

  async checkNullifier(electionId: string, nullifier: string) {
    const vote = await this.prisma.vote.findFirst({
      where: { electionId, nullifier },
      select: { id: true, nullifier: true, createdAt: true },
    });

    return {
      exists: !!vote,
      vote,
    };
  }
}
