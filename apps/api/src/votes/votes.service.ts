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

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async submitVote(dto: SubmitVoteDto) {
    const { publicSignals, electionId, proof } = dto;
    const [root, pubElectionId, pubVote, nullifierHash] = publicSignals;

    // 1. Verify Consistency
    const derivedElectionIdBigInt = bigIntToUuid(pubElectionId);
    if (derivedElectionIdBigInt !== electionId) {
      throw new BadRequestException(
        'Election ID in proof does not match target election',
      );
    }

    // 2. Check if Election exists and is open
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) throw new NotFoundException('Election not found');

    const now = new Date();
    if (election.startTime && now < new Date(election.startTime)) {
        throw new BadRequestException('Voting has not started yet');
    }
    if (election.endTime && now > new Date(election.endTime)) {
        throw new BadRequestException('Voting has already ended');
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
        proof: proof,
        publicSignals: publicSignals as any,
        electionId: electionId,
        candidateId: candidateId,
      },
    });
  }

  async getTally(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true },
    });

    if (!election) throw new NotFoundException('Election not found');

    // Only allow viewing results after voting is closed
    const now = new Date();
    if (!election.endTime || now < new Date(election.endTime)) {
      throw new BadRequestException(
        'Results not available yet - voting period is still active',
      );
    }

    const votes = await this.prisma.vote.findMany({
      where: { electionId },
      select: { candidateId: true },
    });

    const totalEligibleVoters = await this.prisma.eligibleVoter.count({
      where: { electionId },
    });

    const voteCounts: Record<string, number> = {};
    votes.forEach((v) => {
      voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
    });

    const candidatesWithVotes = election.candidates.map((c) => ({
      ...c,
      voteCount: voteCounts[c.id] || 0,
    }));

    let resultSummary: any = {};

    switch (election.type) {
      case 'PRESIDENTIAL': {
        if (candidatesWithVotes.length === 1) {
          const c = candidatesWithVotes[0];
          const threshold = totalEligibleVoters * 0.1;
          const isElected = c.voteCount >= threshold;
          resultSummary = {
            type: 'PRESIDENTIAL_UNCONTESTED',
            threshold: Math.ceil(threshold),
            winner: isElected ? c : null,
            isElected,
            note: isElected ? 'Elected' : 'Not Elected',
          };
        } else {
          const sorted = [...candidatesWithVotes].sort((a, b) => b.voteCount - a.voteCount);
          const winner = sorted[0];
          const runnerUp = sorted[1];
          if (runnerUp && winner.voteCount === runnerUp.voteCount) {
            resultSummary = { type: 'PRESIDENTIAL_CONTESTED', winner: null, tie: true, note: 'Tie' };
          } else {
            resultSummary = { type: 'PRESIDENTIAL_CONTESTED', winner: winner, tie: false, note: 'Elected' };
          }
        }
        break;
      }
      case 'DISTRICT_COUNCILOR': {
        const sorted = [...candidatesWithVotes].sort((a, b) => b.voteCount - a.voteCount);
        if (sorted.length === 0) {
          resultSummary = { type: 'DISTRICT', winner: null, note: 'No candidates' };
        } else {
          const winner = sorted[0];
          const runnerUp = sorted[1];
          if (runnerUp && winner.voteCount === runnerUp.voteCount) {
            resultSummary = { type: 'DISTRICT', winner: null, tie: true, note: 'Tie' };
          } else {
            resultSummary = { type: 'DISTRICT', winner: winner, note: 'Elected' };
          }
        }
        break;
      }
      case 'AT_LARGE_COUNCILOR': {
        const threshold = totalEligibleVoters * 0.01;
        const qualified = candidatesWithVotes.filter((c) => c.voteCount >= threshold);
        const sorted = qualified.sort((a, b) => b.voteCount - a.voteCount);
        const winners = sorted.slice(0, 16);
        resultSummary = {
          type: 'AT_LARGE_SNTV',
          threshold: Math.ceil(threshold),
          winners: winners,
          note: `Top ${winners.length} elected`,
        };
        break;
      }
    }

    return {
      tally: voteCounts,
      totalVotes: votes.length,
      totalEligibleVoters,
      candidates: candidatesWithVotes,
      result: resultSummary,
    };
  }

  async getAuditLogs(electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) throw new NotFoundException('Election not found');

    const now = new Date();
    if (!election.endTime || now < new Date(election.endTime)) {
      throw new BadRequestException('Audit logs not available yet');
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
    return { exists: !!vote, vote };
  }
}
