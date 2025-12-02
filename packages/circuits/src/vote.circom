pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Merkle Tree Inclusion Proof
template MerkleTreeInclusionProof(nLevels) {
    signal input leaf;
    signal input pathIndices[nLevels];
    signal input siblings[nLevels];
    signal output root;

    component poseidons[nLevels];
    component mux[nLevels];

    signal currentLevelHash[nLevels + 1];
    currentLevelHash[0] <== leaf;

    signal left[nLevels];
    signal right[nLevels];

    for (var i = 0; i < nLevels; i++) {
        // pathIndices[i] == 0 => current is left, sibling is right
        // pathIndices[i] == 1 => current is right, sibling is left

        poseidons[i] = Poseidon(2);
        
        // If pathIndices[i] is 0: inputs[0] = current, inputs[1] = sibling
        // If pathIndices[i] is 1: inputs[0] = sibling, inputs[1] = current
        
        // We can use a mathematical trick or a Mux component.
        // Using a simple constraint logic:
        // left = current - pathIndices * (current - sibling)
        // right = sibling + pathIndices * (current - sibling)
        
        var c = currentLevelHash[i];
        var s = siblings[i];
        
        left[i] <== c - pathIndices[i] * (c - s);
        right[i] <== s + pathIndices[i] * (c - s);

        poseidons[i].inputs[0] <== left[i];
        poseidons[i].inputs[1] <== right[i];

        currentLevelHash[i + 1] <== poseidons[i].out;
    }

    root <== currentLevelHash[nLevels];
}

// Vote Circuit
// nLevels: Merkle Tree depth (e.g., 20 for ~1M voters)
template Vote(nLevels) {
    // Public Inputs
    signal input root;              // Merkle Root of eligible voters
    signal input electionId;        // External Nullifier (prevents replay across elections)
    signal input vote;              // The vote choice (e.g., candidate ID)
    
    // Private Inputs
    signal input secret;            // User's secret key (derived from nullifier_seed)
    signal input pathIndices[nLevels]; // Merkle path indices (0 or 1)
    signal input siblings[nLevels];    // Merkle path siblings

    // Outputs
    signal output nullifierHash;    // Unique identifier for this user+election
    signal output voteHash;         // Hash of the vote (to bind proof to vote)

    // 1. Verify Merkle Tree Inclusion
    // Leaf commitment = Poseidon(secret)
    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== secret;
    signal leaf <== leafHasher.out;

    component tree = MerkleTreeInclusionProof(nLevels);
    tree.leaf <== leaf;
    for (var i = 0; i < nLevels; i++) {
        tree.pathIndices[i] <== pathIndices[i];
        tree.siblings[i] <== siblings[i];
    }

    // Constraint: Calculated root must match public input root
    root === tree.root;

    // 2. Generate Nullifier
    // Nullifier = Poseidon(secret, electionId)
    // This ensures:
    // - Deterministic: Same user + same election -> same nullifier
    // - Unique per election: Same user + diff election -> diff nullifier
    // - Private: Cannot derive secret from nullifier
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== electionId;
    nullifierHash <== nullifierHasher.out;

    // 3. Bind Vote to Proof (Signal Hash)
    // We output the square of the vote just to constrain it? 
    // Actually, usually we hash the vote with the proof to prevent tampering.
    // In Groth16, public inputs are part of the verification.
    // By making 'vote' a public input (or hashing it), we bind the proof to this specific vote.
    // Here we output a hash of the vote to be used as a public signal.
    // Or we can just use the vote itself as a public input if it's a number.
    // Let's hash it to be safe and uniform.
    
    component voteHasher = Poseidon(2);
    voteHasher.inputs[0] <== vote;
    voteHasher.inputs[1] <== secret; // Salt with secret so vote is not easily guessable from hash? 
                                     // Wait, if we want privacy of the vote content vis-a-vis the proof, 
                                     // the vote is usually public to the backend (to count it).
                                     // The proof proves "I have the right to vote".
                                     // The nullifier prevents double voting.
                                     // We need to ensure this proof is FOR this vote.
                                     
    // Standard practice: Hash(vote, electionId, ... ) is not needed if 'vote' is a public input to the verifier.
    // But to make the circuit generic, let's just output the voteHash = vote * vote (dummy) or just pass it through?
    // Actually, we can just constrain the vote to be the public input.
    // In Circom, if we declare 'vote' as input, it is private by default unless specified in main.
    // We will make 'vote' public in main.
    
    // Let's add a constraint that binds the vote to the proof.
    // Actually, simply having 'vote' as an input used in a constraint is enough.
    // Let's calculate a "Signal Hash" that includes the vote.
    // signalHash = Poseidon(electionId, vote)
    
    component signalHasher = Poseidon(2);
    signalHasher.inputs[0] <== electionId;
    signalHasher.inputs[1] <== vote;
    
    // We don't strictly need to output this if 'vote' and 'electionId' are public inputs.
    // But let's output it for consistency.
    voteHash <== signalHasher.out;
}
