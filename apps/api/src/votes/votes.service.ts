import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { verifyVoteProof } from '@savote/crypto-lib';
import { bigIntToUuid } from '../utils/zk-utils';
import { ElectionType } from '@prisma/client';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async submitVote(dto: SubmitVoteDto) {
    const { proof, publicSignals, electionId, vote } = dto;
    // publicSignals order from main.circom: [root, electionId, vote, nullifierHash]
    const [root, pubElectionId, pubVote, nullifierHash] = publicSignals;

    // 1. Verify Consistency
    const derivedElectionIdBigInt = bigIntToUuid(pubElectionId);
    if (derivedElectionIdBigInt !== electionId) {
      throw new BadRequestException(
        'Election ID in proof does not match target election',
      );
    }

    // 2. Check if Election exists
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

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
    if (election.merkleRoot && election.merkleRoot !== root) {
      throw new BadRequestException(
        'Invalid Merkle Root (Eligibility verification failed)',
      );
    }

    // 6. Verify Candidate Validity
    const candidateId = bigIntToUuid(pubVote);
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate || candidate.electionId !== electionId) {
      throw new BadRequestException('Invalid candidate for this election');
    }

    // 7. Save Vote
    return this.prisma.vote.create({
      data: {
        nullifierHash: nullifierHash,
        proof: proof, // Prisma Json type
        publicSignals: publicSignals as any,
        electionId: electionId,
        candidateId: candidateId,
      },
    });
  }

  async getTally(electionId: string) {
    // Check if election exists and get its status
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: true,
      },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Only allow viewing results after voting is closed
    if (election.status !== 'VOTING_CLOSED' && election.status !== 'TALLIED') {
      // Return a restricted object or throw. The UI should handle 400.
      // User asked: "Monitor to confirm it can be displayed AFTER voting ends".
      // So enforcing closed status is correct.
      throw new BadRequestException(
        'Results not available yet - election must be closed by admin',
      );
    }

    // Get Total Votes Cast
    const votes = await this.prisma.vote.findMany({
      where: { electionId },
      select: { candidateId: true },
    });

    // Get Total Eligible Voters (for thresholds)
    const totalEligibleVoters = await this.prisma.eligibleVoter.count({
      where: { electionId },
    });

    // Count votes
    const voteCounts: Record<string, number> = {};
    votes.forEach((v) => {
      voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
    });

    // Calculate Results based on Type
    const candidatesWithVotes = election.candidates.map((c) => ({
      ...c,
      voteCount: voteCounts[c.id] || 0,
    }));

    let resultSummary: any = {};
    const totalVotesCast = votes.length;

    switch (election.type) {
      case ElectionType.PRESIDENTIAL: {
        // Type 1: President/VP
        // If only 1 candidate (Same-number election)
        if (candidatesWithVotes.length === 1) {
          const c = candidatesWithVotes[0];
          const threshold = totalEligibleVoters * 0.1;
          const isElected = c.voteCount >= threshold;
          resultSummary = {
            type: 'PRESIDENTIAL_UNCONTESTED',
            threshold: Math.ceil(threshold),
            winner: isElected ? c : null,
            isElected,
            note: isElected
              ? 'Elected (Passed 10% threshold)'
              : 'Not Elected (Failed 10% threshold)',
          };
        } else {
          // Simple Majority
          // Sort desc
          const sorted = [...candidatesWithVotes].sort(
            (a, b) => b.voteCount - a.voteCount,
          );
          const winner = sorted[0];
          const runnerUp = sorted[1];

          // Check tie
          if (runnerUp && winner.voteCount === runnerUp.voteCount) {
            resultSummary = {
              type: 'PRESIDENTIAL_CONTESTED',
              winner: null,
              tie: true,
              note: 'Tie detected. Re-election required.',
            };
          } else {
            resultSummary = {
              type: 'PRESIDENTIAL_CONTESTED',
              winner: winner,
              tie: false,
              note: 'Elected by simple majority',
            };
          }
        }
        break;
      }
      case ElectionType.DISTRICT_COUNCILOR: {
        // Type 2: District (Simple Majority)
        // Sort desc
        const sorted = [...candidatesWithVotes].sort(
          (a, b) => b.voteCount - a.voteCount,
        );
        if (sorted.length === 0) {
          resultSummary = {
            type: 'DISTRICT',
            winner: null,
            note: 'No candidates',
          };
          break;
        }
        const winner = sorted[0];
        const runnerUp = sorted[1];

        if (runnerUp && winner.voteCount === runnerUp.voteCount) {
          resultSummary = {
            type: 'DISTRICT',
            winner: null,
            tie: true,
            note: 'Tie detected. Draw lots required.',
          };
        } else {
          resultSummary = {
            type: 'DISTRICT',
            winner: winner,
            note: 'Elected',
          };
        }
        break;
      }
      case ElectionType.AT_LARGE_COUNCILOR: {
        // Type 3: SNTV (Threshold 1%, Top 16)
        const threshold = totalEligibleVoters * 0.01;
        const qualified = candidatesWithVotes.filter(
          (c) => c.voteCount >= threshold,
        );
        const sorted = qualified.sort((a, b) => b.voteCount - a.voteCount);
        const winners = sorted.slice(0, 16);

        resultSummary = {
          type: 'AT_LARGE_SNTV',
          threshold: Math.ceil(threshold),
          winners: winners,
          totalQualified: qualified.length,
          note: `Top ${winners.length} elected (passed 1% threshold)`,
        };
        break;
      }
    }

    return {
      tally: voteCounts,
      totalVotes: totalVotesCast,
      totalEligibleVoters,
      candidates: candidatesWithVotes,
      result: resultSummary,
    };
  }

  async getAuditLogs(electionId: string) {
    // Check if election exists and get its status
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      select: { status: true },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Only allow viewing audit logs after voting is closed
    if (election.status !== 'VOTING_CLOSED' && election.status !== 'TALLIED') {
      throw new BadRequestException(
        'Audit logs not available yet - election must be closed by admin',
      );
    }

    return this.prisma.vote.findMany({
      where: { electionId },
      select: {
        id: true,
        nullifierHash: true,
        proof: true,
        publicSignals: true,
        createdAt: true,
      },
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
