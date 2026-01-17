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
    
    signal currentLevelHash[nLevels + 1];
    currentLevelHash[0] <== leaf;

    signal left[nLevels];
    signal right[nLevels];

    for (var i = 0; i < nLevels; i++) {
        poseidons[i] = Poseidon(2);
        
        // If pathIndices[i] == 0: left = current, right = sibling
        // If pathIndices[i] == 1: left = sibling, right = current
        
        var c = currentLevelHash[i];
        var s = siblings[i];
        
        // Constraint for switching logic
        // left = c - index * (c - s)
        // right = s + index * (c - s)
        
        left[i] <== c - pathIndices[i] * (c - s);
        right[i] <== s + pathIndices[i] * (c - s);

        poseidons[i].inputs[0] <== left[i];
        poseidons[i].inputs[1] <== right[i];

        currentLevelHash[i + 1] <== poseidons[i].out;
    }

    root <== currentLevelHash[nLevels];
}

// Vote Circuit
// nLevels: Merkle Tree depth (e.g., 20)
template Vote(nLevels) {
    // Public Inputs
    signal input root;              // Merkle Root
    signal input electionId;        // Election ID
    signal input vote;              // Vote choice
    signal input nullifierHash;     // Public nullifier to prevent double voting

    // Private Inputs
    signal input secret;            // User's secret key (Nullifier Secret)
    signal input studentIdHash;     // User's Student ID Hash
    signal input pathIndices[nLevels]; // Merkle path indices
    signal input siblings[nLevels];    // Merkle path siblings

    // Outputs
    // In Groth16, signals not listed in 'public' are private.
    // We don't output signals for logic check, we use constraints.
    // But we usually output signals that we want to be public inputs to the verification.

    // 1. Verify Commitment (Merkle Leaf)
    // commitment = Poseidon(studentIdHash, secret)
    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== studentIdHash;
    leafHasher.inputs[1] <== secret;
    signal leaf <== leafHasher.out;

    // 2. Verify Merkle Tree Inclusion
    component tree = MerkleTreeInclusionProof(nLevels);
    tree.leaf <== leaf;
    for (var i = 0; i < nLevels; i++) {
        tree.pathIndices[i] <== pathIndices[i];
        tree.siblings[i] <== siblings[i];
    }
    // Constraint: Computed root must match public input root
    root === tree.root;

    // 3. Verify Nullifier
    // nullifier = Poseidon(secret, electionId)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== electionId;
    
    // Constraint: Computed nullifier must match public input nullifierHash
    nullifierHash === nullifierHasher.out;

    // 4. Bind Vote
    // We square the vote signal to constrain it to ensure it is included in the circuit
    // This is a dummy constraint to make sure 'vote' signal is part of the R1CS
    signal voteSquare <== vote * vote;
}