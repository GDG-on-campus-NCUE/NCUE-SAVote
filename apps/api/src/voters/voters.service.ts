import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { MerkleTree } from 'merkletreejs';
import * as crypto from 'crypto';
import type { VoterEligibilityResponse, Election as SharedElection, ElectionStatus } from '@savote/shared-types';
import type { Election as PrismaElection } from '@prisma/client';

export interface ParsedVoterRecord {
  studentId: string;
  studentIdHash: string;
  class: string;
}

export interface MerkleTreeResult {
  root: string;
  leaves: Buffer[];
  tree: MerkleTree;
}

export interface ImportVotersResult {
  votersImported: number;
  duplicatesSkipped: number;
  merkleRootHash: string;
}

@Injectable()
export class VotersService {
  private readonly logger = new Logger(VotersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async parseCsv(buffer: Buffer): Promise<ParsedVoterRecord[]> {
    if (!buffer || !buffer.length) {
      this.logger.error('CSV file is empty');
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
      this.logger.error(`Failed to parse CSV: ${error.message}`);
      throw new BadRequestException('INVALID_CSV_FORMAT');
    }

    if (!rows.length) {
      this.logger.warn('CSV file has no rows');
      throw new BadRequestException('CSV_NO_ROWS');
    }

    const normalized: ParsedVoterRecord[] = [];
    const dedupe = new Set<string>();

    for (const row of rows) {
      if (!Object.prototype.hasOwnProperty.call(row, 'studentId') ||
        !Object.prototype.hasOwnProperty.call(row, 'class')) {
        this.logger.error('CSV missing required headers: studentId, class');
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
      normalized.push({ studentId, studentIdHash: this.hashStudentId(studentId), class: classValue });
    }

    if (!normalized.length) {
      this.logger.warn('No valid voter records found in CSV');
      throw new BadRequestException('CSV_NO_VALID_ROWS');
    }

    this.logger.log(`Parsed ${normalized.length} valid voter records`);
    return normalized;
  }

  generateMerkleTree(records: ParsedVoterRecord[]): MerkleTreeResult {
    if (!records.length) {
      this.logger.warn('Cannot generate Merkle tree: No voters provided');
      throw new BadRequestException('MERKLE_NO_VOTERS');
    }

    const ordered = [...records].sort((a, b) => {
      if (a.studentIdHash === b.studentIdHash) {
        return a.class.localeCompare(b.class);
      }
      return a.studentIdHash.localeCompare(b.studentIdHash);
    });

    const leaves = ordered.map((record) => this.hashLeaf(record));
    const tree = new MerkleTree(leaves, (data: Buffer) => this.sha256(data), {
      sortPairs: true,
    });
    const rootBuffer = tree.getRoot();

    if (!rootBuffer || rootBuffer.length === 0) {
      this.logger.error('Merkle tree generation failed: Root is undefined');
      throw new BadRequestException('MERKLE_ROOT_UNDEFINED');
    }

    return {
      root: rootBuffer.toString('hex'),
      leaves,
      tree,
    };
  }

  async importVoters(electionId: string, fileBuffer: Buffer): Promise<ImportVotersResult> {
    this.logger.log(`Importing voters for election: ${electionId}`);
    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) {
      this.logger.error(`Election not found: ${electionId}`);
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

    this.logger.log(`Imported ${createResult.count} voters. Skipped ${records.length - createResult.count} duplicates.`);

    const allVoters = await this.prisma.eligibleVoter.findMany({
      where: { electionId },
      select: {
        studentId: true,
        class: true,
      },
    });

    const merkle = this.generateMerkleTree(
      allVoters.map((voter) => ({
        studentId: voter.studentId,
        studentIdHash: this.hashStudentId(voter.studentId),
        class: voter.class,
      })),
    );

    await this.prisma.election.update({
      where: { id: electionId },
      data: {
        merkleRootHash: merkle.root,
      },
    });

    this.logger.log(`Updated Merkle root for election ${electionId}: ${merkle.root}`);

    return {
      votersImported: createResult.count,
      duplicatesSkipped: records.length - createResult.count,
      merkleRootHash: merkle.root,
    };
  }

  async verifyEligibility(
    electionId: string,
    studentIdHash: string,
    classValue: string,
  ): Promise<VoterEligibilityResponse> {
    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) {
      throw new NotFoundException('ELECTION_NOT_FOUND');
    }

    const normalizedStudentIdHash = studentIdHash.toLowerCase();
    const normalizedClass = this.normalizeClass(classValue);

    const voters = await this.prisma.eligibleVoter.findMany({
      where: { electionId },
      select: {
        studentId: true,
        class: true,
      },
    });

    if (!voters.length) {
      this.logger.warn(`No voters found for election: ${electionId}`);
      const sharedElection = this.toSharedElection(election);
      return {
        eligible: false,
        election: sharedElection,
        merkleRootHash: election.merkleRootHash,
        merkleProof: [],
        reason: 'NO_VOTERS',
      };
    }

    const records = voters.map((voter) => ({
      studentId: voter.studentId,
      studentIdHash: this.hashStudentId(voter.studentId),
      class: voter.class,
    }));
    const merkle = this.generateMerkleTree(records);
    const targetLeaf = this.hashLeaf({
      studentId: normalizedStudentIdHash,
      studentIdHash: normalizedStudentIdHash,
      class: normalizedClass,
    });
    const proof = merkle.tree.getProof(targetLeaf);
    const leavesHex = merkle.tree
      .getLeaves()
      .map((leaf) => (Buffer.isBuffer(leaf) ? leaf.toString('hex') : Buffer.from(leaf as Buffer).toString('hex')));
    const targetHex = targetLeaf.toString('hex');
    const leafIndex = leavesHex.indexOf(targetHex);

    const sharedElection = this.toSharedElection(election);
    if (leafIndex === -1) {
      this.logger.warn(`Voter not eligible: ${normalizedStudentIdHash} in class ${normalizedClass}`);
      return {
        eligible: false,
        election: sharedElection,
        merkleRootHash: merkle.root,
        merkleProof: [],
        reason: 'NOT_ELIGIBLE',
      };
    }

    return {
      eligible: true,
      election: sharedElection,
      merkleRootHash: merkle.root,
      merkleProof: proof.map((node) => node.data.toString('hex')),
      leafIndex,
    };
  }

  private normalizeClass(raw: string | undefined): string {
    return raw?.toString().trim().replace(/\s+/g, '_').toUpperCase() || '';
  }

  private normalizeStudentId(raw: string | undefined): string {
    return raw?.toString().trim().toUpperCase() || '';
  }

  private hashLeaf(record: ParsedVoterRecord): Buffer {
    return this.sha256(Buffer.from(`${record.studentIdHash}:${record.class}`));
  }

  private sha256(payload: Buffer): Buffer {
    return crypto.createHash('sha256').update(payload).digest();
  }

  private hashStudentId(studentId: string): string {
    return crypto.createHash('sha256').update(studentId).digest('hex');
  }

  private toSharedElection(election: PrismaElection): SharedElection {
    return {
      id: election.id,
      name: election.name,
      merkleRootHash: election.merkleRootHash,
      status: election.status as unknown as ElectionStatus,
      startTime: election.startTime,
      endTime: election.endTime,
      createdAt: election.createdAt,
      updatedAt: election.updatedAt,
      candidates: [], // TODO: Fetch candidates if needed, or make it optional in SharedElection
    };
  }
}
