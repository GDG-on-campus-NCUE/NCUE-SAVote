import { VotersService, ParsedVoterRecord } from '../../src/voters/voters.service';
import { MerkleTree } from 'merkletreejs';
import * as crypto from 'crypto';

const mockPrismaService = {
    eligibleVoter: {},
    election: {},
};

describe('VotersService (unit)', () => {
    let service: VotersService;

    beforeEach(() => {
        service = new VotersService(mockPrismaService as any);
    });

    describe('parseCsv', () => {
        it('normalizes CSV rows into student/class pairs', async () => {
            const csv = `studentId,class\n A1345 , csie_3a \nB2001,IM_2B\n`;
            const rows = await service.parseCsv(Buffer.from(csv, 'utf8'));

            expect(rows).toEqual<ParsedVoterRecord[]>([
                { studentId: 'A1345', studentIdHash: hashId('A1345'), class: 'CSIE_3A' },
                { studentId: 'B2001', studentIdHash: hashId('B2001'), class: 'IM_2B' },
            ]);
        });

        it('rejects files missing required headers', async () => {
            const csv = `student,classroom\nA1,CSIE`; // wrong headers
            await expect(service.parseCsv(Buffer.from(csv))).rejects.toThrow('INVALID_CSV_HEADERS');
        });
    });

    describe('generateMerkleTree', () => {
        it('produces deterministic Merkle root with SHA-256 leaves', () => {
            const entries: ParsedVoterRecord[] = [
                { studentId: 'A1001', studentIdHash: hashId('A1001'), class: 'CSIE_3A' },
                { studentId: 'B2002', studentIdHash: hashId('B2002'), class: 'IM_2B' },
                { studentId: 'C3003', studentIdHash: hashId('C3003'), class: 'LAW_1A' },
            ];

            const { root, leaves } = service.generateMerkleTree(entries);
            const expectedRoot = buildReferenceRoot(entries);

            expect(root).toBe(expectedRoot);
            expect(leaves).toHaveLength(entries.length);
            leaves.forEach((leaf) => expect(Buffer.isBuffer(leaf)).toBe(true));
        });
    });
});

function buildReferenceRoot(entries: ParsedVoterRecord[]): string {
    const ordered = [...entries].sort((a, b) => {
        if (a.studentIdHash === b.studentIdHash) {
            return a.class.localeCompare(b.class);
        }
        return a.studentIdHash.localeCompare(b.studentIdHash);
    });
    const leaves = ordered.map((entry) =>
        crypto.createHash('sha256').update(`${entry.studentIdHash}:${entry.class}`).digest(),
    );
    const tree = new MerkleTree(leaves, (data: Buffer) =>
        crypto.createHash('sha256').update(data).digest(),
        { sortPairs: true });
    return tree.getRoot().toString('hex');
}

function hashId(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}
