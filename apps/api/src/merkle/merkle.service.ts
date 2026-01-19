import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { poseidonHash } from '@savote/crypto-lib';

@Injectable()
export class MerkleTreeService {
  private readonly levels = 20;
  private zeros: string[] = []; // Cache for zero values at each level

  constructor(private prisma: PrismaService) {
    this.initZeros();
  }

  private async initZeros() {
    // Level 0 zero is usually 0
    let currentZero = '0';
    this.zeros.push(currentZero);
    for (let i = 0; i < this.levels; i++) {
      currentZero = await poseidonHash([currentZero, currentZero]);
      this.zeros.push(currentZero);
    }
  }

  async getTreeRoot(electionId: string): Promise<string> {
    const leaves = await this.getLeaves(electionId);
    return this.computeRoot(leaves);
  }

  async addLeaf(electionId: string, commitment: string): Promise<string> {
    // 1. Check if user already in tree? (Handled by DB constraint usually)
    // 2. We don't need to persist the tree structure, just the leaves in EligibleVoter
    //    But we might want to update the cached root in Election table for quick lookup/verification

    // Fetch all current leaves (including the new one if it was already added to DB,
    // but the caller might be adding it now.
    // The flow in TODO says: add to EligibleVoter, call addLeaf, update Election.merkleRoot

    // So we assume the leaf IS NOT YET in the DB or IS in the DB?
    // Let's assume the caller manages the DB transaction.
    // Actually, recomputing the whole tree for every voter is O(N).
    // For 1000 voters, it's fine. For 100k, it's bad.
    // Optimization: Incremental update.

    // For now, I'll implement "fetch all and recompute" for simplicity and correctness.
    // Ideally we store the tree or at least the frontier.

    const leaves = await this.getLeaves(electionId);
    // If the commitment is not in leaves, we assume it was just added to DB
    // OR we can pass it here.
    // Let's rely on DB.

    const root = await this.computeRoot(leaves);

    // Update election root
    await this.prisma.election.update({
      where: { id: electionId },
      data: { merkleRoot: root },
    });

    return root;
  }

  async getProof(electionId: string, commitment: string) {
    const leaves = await this.getLeaves(electionId);
    const index = leaves.indexOf(commitment);
    if (index === -1) {
      throw new Error('Leaf not found in tree');
    }

    const { root, pathIndices, siblings } = await this.computeProof(
      leaves,
      index,
    );
    return { root, pathIndices, siblings };
  }

  private async getLeaves(electionId: string): Promise<string[]> {
    const voters = await this.prisma.eligibleVoter.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' }, // Order is important!
      select: { identityCommitment: true },
    });
    return voters
      .map((v) => v.identityCommitment)
      .filter((c): c is string => c !== null);
  }

  private async computeRoot(leaves: string[]): Promise<string> {
    // Ensure zeros are ready
    if (this.zeros.length === 0) await this.initZeros();

    let currentLevel = [...leaves];

    // Pad with zeros to next power of 2?
    // Sparse Merkle Tree usually handles arbitrary index by using zeros for empty spots.
    // But here we are filling sequentially.
    // If we have N leaves, the tree effectively has size 2^20.
    // We only compute up to the last non-zero leaf's path?
    // No, standard Merkle Tree implementation:

    // We treat it as a Sparse Tree where leaves are at indices 0 to N-1.
    // The rest are zeros.

    // We can simulate the tree construction layer by layer.

    // Optimized: Only compute hashes for used nodes.

    // But to get the ROOT, we need to hash everything up to the root.
    // If we have N leaves, we hash pairs.

    // Key: If a node and its sibling are both "zero" (default value for that level),
    // their parent is the "zero" for the next level. We have these cached in `this.zeros`.

    let level = 0;
    // We process "currentLevel" which contains only the non-default nodes at this level.
    // We also need to know their indices if we were sparse, but here we are dense 0..N-1.

    let count = currentLevel.length;

    while (level < this.levels) {
      const nextLevel: string[] = [];
      const zeroVal = this.zeros[level];

      for (let i = 0; i < count; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < count ? currentLevel[i + 1] : zeroVal;
        const parent = await poseidonHash([left, right]);
        nextLevel.push(parent);
      }

      currentLevel = nextLevel;
      count = Math.ceil(count / 2);

      // If we are left with 1 node but we are not at root yet,
      // we must continue hashing with zeros until we reach level 20.
      // But wait, if count is 1, next iteration:
      // left = node, right = zeroVal[level+1]...

      // Optimization: if count is 1 and it IS the default zero (unlikely if we have leaves), stop?
      // No.

      level++;
    }

    return currentLevel[0] || this.zeros[this.levels]; // Return root (or zero root if empty)
  }

  private async computeProof(leaves: string[], index: number) {
    if (this.zeros.length === 0) await this.initZeros();

    const pathIndices: number[] = [];
    const siblings: string[] = [];

    let currentLevel = [...leaves];
    let currentIndex = index;
    let count = currentLevel.length;

    for (let level = 0; level < this.levels; level++) {
      const zeroVal = this.zeros[level];

      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      let sibling: string;
      if (siblingIndex < count) {
        sibling = currentLevel[siblingIndex];
      } else {
        sibling = zeroVal;
      }

      pathIndices.push(isRightNode ? 1 : 0);
      siblings.push(sibling);

      // Compute next level for the path we are tracking
      // We don't need to compute ALL nodes, just the ones needed for the root?
      // Wait, the "root" returned by this function should match the global root.
      // If I don't compute the whole tree, I can't return the root easily unless I trust `computeRoot`.
      // But the user wants { root, pathIndices, siblings }.

      // Let's re-simulate the level hashing to be consistent with `computeRoot`.

      const nextLevel: string[] = [];
      for (let i = 0; i < count; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < count ? currentLevel[i + 1] : zeroVal;
        const parent = await poseidonHash([left, right]);
        nextLevel.push(parent);
      }
      currentLevel = nextLevel;
      count = Math.ceil(count / 2);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      root: currentLevel[0] || this.zeros[this.levels],
      pathIndices,
      siblings,
    };
  }
}
