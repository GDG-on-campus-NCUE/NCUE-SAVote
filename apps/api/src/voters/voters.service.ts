import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { poseidonHash } from '@savote/crypto-lib';
import type {
  VoterEligibilityResponse,
  Election as SharedElection,
  ElectionStatus,
  ElectionType,
} from '@savote/shared-types';
import type { Election as PrismaElection } from '@prisma/client';
import * as crypto from 'crypto';
import { MerkleTreeService } from '../merkle/merkle.service';

export interface ParsedVoterRecord {
  studentId: string;
  studentIdHash: string;
  class: string;
}

export interface ImportVotersResult {
  votersImported: number;
  duplicatesSkipped: number;
}

@Injectable()
export class VotersService {
  private readonly logger = new Logger(VotersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merkleTreeService: MerkleTreeService,
  ) {}

  // ===========================================================================
  // Core Business Logic
  // ===========================================================================

  async registerIdentityCommitment(
    electionId: string,
    studentIdHash: string,
    commitment: string,
  ) {
    this.logger.log(
      `Registering identity commitment for election ${electionId}`,
    );

    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('ELECTION_NOT_FOUND');
    }

    if (election.status !== 'REGISTRATION_OPEN') {
      throw new BadRequestException('REGISTRATION_CLOSED');
    }

    const voter = await this.prisma.eligibleVoter.findFirst({
      where: {
        electionId,
        studentId: studentIdHash,
      },
    });

    if (!voter) {
      throw new NotFoundException('VOTER_NOT_ELIGIBLE');
    }

    if (voter.identityCommitment) {
      throw new BadRequestException('COMMITMENT_ALREADY_REGISTERED');
    }

    await this.prisma.eligibleVoter.update({
      where: { id: voter.id },
      data: { identityCommitment: commitment },
    });

    return { success: true };
  }

  async snapshotElection(electionId: string): Promise<string> {
    this.logger.log(
      `Snapshotting election ${electionId} (Generating Merkle Root)`,
    );

    // Compute root using MerkleTreeService
    const root = await this.merkleTreeService.getTreeRoot(electionId);

    // Update Election
    await this.prisma.election.update({
      where: { id: electionId },
      data: { merkleRoot: root },
    });

    return root;
  }

  async getMerkleProof(electionId: string, commitment: string) {
    return this.merkleTreeService.getProof(electionId, commitment);
  }

  // ===========================================================================
  // Import / Eligibility Logic
  // ===========================================================================

  async parseCsv(buffer: Buffer): Promise<ParsedVoterRecord[]> {
    if (!buffer || !buffer.length) {
      throw new BadRequestException('CSV_FILE_EMPTY');
    }

    let rows: Record<string, string>[];
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true,
      });
    } catch (error) {
      throw new BadRequestException('INVALID_CSV_FORMAT');
    }

    const normalized: ParsedVoterRecord[] = [];
    const dedupe = new Set<string>();

    for (const row of rows) {
      if (
        !Object.prototype.hasOwnProperty.call(row, 'studentId') ||
        !Object.prototype.hasOwnProperty.call(row, 'class')
      ) {
        throw new BadRequestException('INVALID_CSV_HEADERS');
      }

      const studentId = this.normalizeStudentId(row.studentId);
      const classValue = this.normalizeClass(row.class);

      if (!studentId || !classValue) {
        continue;
      }

      const key = `${studentId}:${classValue}`;
      if (dedupe.has(key)) {
        continue;
      }
      dedupe.add(key);
      normalized.push({
        studentId,
        studentIdHash: this.hashStudentId(studentId),
        class: classValue,
      });
    }

    return normalized;
  }

  async importVoters(
    electionId: string,
    fileBuffer: Buffer,
  ): Promise<ImportVotersResult> {
    this.logger.log(`Importing voters for election: ${electionId}`);
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('ELECTION_NOT_FOUND');
    }

    const records = await this.parseCsv(fileBuffer);

    const createResult = await this.prisma.eligibleVoter.createMany({
      data: records.map((record) => ({
        electionId,
        studentId: record.studentId,
        class: record.class,
      })),
      skipDuplicates: true,
    });

    this.logger.log(`Imported ${createResult.count} voters.`);

    return {
      votersImported: createResult.count,
      duplicatesSkipped: records.length - createResult.count,
    };
  }

  async verifyEligibility(
    electionId: string,
    studentIdHash: string,
    classValue: string,
  ): Promise<VoterEligibilityResponse> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('ELECTION_NOT_FOUND');
    }

    const voters = await this.prisma.eligibleVoter.findMany({
      where: { electionId },
      select: {
        studentId: true,
        class: true,
        identityCommitment: true,
      },
    });

    const sharedElection = this.toSharedElection(election);

    // Find the specific voter
    const voter = voters.find(
      (v) => this.hashStudentId(v.studentId) === studentIdHash,
    );

    if (!voter) {
      return {
        eligible: false,
        election: sharedElection,
        reason: 'NOT_ELIGIBLE',
        merkleProof: [],
        merkleRootHash: election.merkleRoot,
      };
    }

    return {
      eligible: true,
      election: sharedElection,
      merkleRootHash: election.merkleRoot,
      merkleProof: [],
      isRegistered: !!voter.identityCommitment,
    } as any;
  }

  private normalizeClass(raw: string | undefined): string {
    return raw?.toString().trim().replace(/\s+/g, '_').toUpperCase() || '';
  }

  private normalizeStudentId(raw: string | undefined): string {
    return raw?.toString().trim().toUpperCase() || '';
  }

  private hashStudentId(studentId: string): string {
    return crypto.createHash('sha256').update(studentId).digest('hex');
  }

  private toSharedElection(election: PrismaElection): SharedElection {
    return {
      id: election.id,
      name: election.name,
      merkleRootHash: election.merkleRoot,
      status: election.status as unknown as ElectionStatus,
      type: election.type as unknown as ElectionType,
      startTime: election.startTime,
      endTime: election.endTime,
      createdAt: election.createdAt,
      updatedAt: election.updatedAt,
      candidates: [],
    };
  }
}
