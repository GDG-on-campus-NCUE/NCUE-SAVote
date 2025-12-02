import path from 'path';
// @ts-ignore
import { wasm } from 'circom_tester';
import { expect } from 'chai';
// @ts-ignore
import { buildPoseidon } from 'circomlibjs';
import { MerkleTree } from 'merkletreejs';

describe('Vote Circuit', function () {
    this.timeout(100000);

    let circuit: any;
    let poseidon: any;

    before(async () => {
        circuit = await wasm(path.join(__dirname, 'circuits', 'vote_test.circom'));
        poseidon = await buildPoseidon();
    });

    const hash = (inputs: any[]) => {
        const h = poseidon(inputs);
        return poseidon.F.toString(h);
    };

    it('should generate a valid proof for a valid vote', async () => {
        // 1. Setup Merkle Tree
        const secret = 123456789n;
        const leaf = hash([secret]);
        
        // Create a tree with 4 leaves (depth 2)
        const leaves = [leaf, 111n, 222n, 333n].map(x => x.toString());
        // We need a compatible hash function for MerkleTreejs that matches Poseidon
        // But MerkleTreejs uses Buffer/String. 
        // It's easier to implement a simple Merkle Tree manually or just calculate path for depth 2.
        
        // Let's calculate path manually for leaf at index 0
        // Tree:
        //       Root
        //     /      \
        //   H1        H2
        //  /  \      /  \
        // L0  L1    L2  L3
        
        const L0 = leaf;
        const L1 = hash([111n]);
        const L2 = hash([222n]);
        const L3 = hash([333n]);
        
        const H1 = hash([L0, L1]); // Poseidon(2) takes 2 inputs
        // Note: My MerkleTreeInclusionProof uses:
        // if pathIndex == 0: Poseidon([current, sibling])
        // if pathIndex == 1: Poseidon([sibling, current])
        
        const H2 = hash([L2, L3]);
        const Root = hash([H1, H2]);
        
        // Path for L0 (index 0 -> binary 00)
        // Level 0: Sibling is L1, index is 0
        // Level 1: Sibling is H2, index is 0
        
        const pathIndices = [0, 0];
        const siblings = [L1, H2];
        
        const electionId = 999n;
        const vote = 1n; // Candidate ID 1
        
        const input = {
            root: Root,
            electionId: electionId.toString(),
            vote: vote.toString(),
            secret: secret.toString(),
            pathIndices: pathIndices,
            siblings: siblings
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        
        // Check Nullifier Hash
        // Nullifier = Poseidon([secret, electionId])
        const expectedNullifier = hash([secret, electionId]);
        await circuit.assertOut(witness, { nullifierHash: expectedNullifier });
        
        // Check Vote Hash
        // VoteHash = Poseidon([electionId, vote])
        const expectedVoteHash = hash([electionId, vote]);
        await circuit.assertOut(witness, { voteHash: expectedVoteHash });
    });

    it('should fail if secret is wrong', async () => {
        const secret = 123456789n;
        const wrongSecret = 999999999n;
        const leaf = hash([secret]);
        
        const L0 = leaf;
        const L1 = hash([111n]);
        const L2 = hash([222n]);
        const L3 = hash([333n]);
        
        const H1 = hash([L0, L1]);
        const H2 = hash([L2, L3]);
        const Root = hash([H1, H2]);
        
        const pathIndices = [0, 0];
        const siblings = [L1, H2];
        
        const electionId = 999n;
        const vote = 1n;
        
        const input = {
            root: Root,
            electionId: electionId.toString(),
            vote: vote.toString(),
            secret: wrongSecret.toString(), // Wrong secret
            pathIndices: pathIndices,
            siblings: siblings
        };

        try {
            await circuit.calculateWitness(input);
            throw new Error('Should have failed');
        } catch (e: any) {
            expect(e.message).to.include('Assert Failed');
        }
    });
});
