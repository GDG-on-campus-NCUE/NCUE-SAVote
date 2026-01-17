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
    // publicSignals order from main.circom: [root, electionId, vote, nullifierHash]
    const [root, pubElectionId, pubVote, nullifierHash] = publicSignals;

    // 1. Verify Consistency
    const expectedElectionIdBigInt = bigIntToUuid(pubElectionId) === electionId; // Check if converting back matches, OR convert input to BigInt
    // Better: Convert uuid to BigInt and compare strings
    const electionIdBigInt = bigIntToUuid(pubElectionId);
    
    // We expect the public signal 'electionId' to match the electionId passed in DTO
    // The circuit uses uuidToBigInt(electionId) as input.
    // So pubElectionId should be String(uuidToBigInt(electionId))
    
    const derivedElectionIdBigInt = bigIntToUuid(pubElectionId);
    if (derivedElectionIdBigInt !== electionId) {
       // Ideally we use uuidToBigInt(electionId).toString() === pubElectionId
       // But bigIntToUuid is the inverse.
       // Let's rely on bigIntToUuid for checking.
       throw new BadRequestException('Election ID in proof does not match target election');
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
      where: { electionId_nullifierHash: { electionId, nullifierHash } },
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
    // We should check if 'root' matches the election's merkleRoot
    if (election.merkleRoot && election.merkleRoot !== root) {
       // Note: In a real system, we might support multiple valid roots (if tree updates).
       // But here we assume one static tree per election for simplicity.
       throw new BadRequestException('Invalid Merkle Root (Eligibility verification failed)');
    }

    // 6. Save Vote
    return this.prisma.vote.create({
      data: {
        nullifierHash: nullifierHash,
        proof: proof as any, // Prisma Json type
        publicSignals: publicSignals as any,
        electionId: electionId,
        candidateId: bigIntToUuid(pubVote),
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
      const voteBigInt = signals[2]; // vote is the 3rd public signal in main.circom? Wait.
      // main.circom: component main {public [root, electionId, vote, nullifierHash]}
      // publicSignals: [root, electionId, vote, nullifierHash]
      // vote is index 2.
      
      const voteVal = signals[2];
      const candidateId = bigIntToUuid(voteVal);
      
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
        nullifierHash: true,
        proof: true,
        publicSignals: true,
        createdAt: true
      }
    });
  }

  async checkNullifier(electionId: string, nullifierHash: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { electionId_nullifierHash: { electionId, nullifierHash } },
      select: { id: true, nullifierHash: true, createdAt: true },
    });

    return {
      exists: !!vote,
      vote,
    };
  }
}
