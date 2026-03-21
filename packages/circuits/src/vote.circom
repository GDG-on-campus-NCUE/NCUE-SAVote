pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom"; 

template Vote() {
    // 1. Private Inputs:
    signal input studentId; 
    signal input secret;

    // 2. Public Output:
    signal output commitment;

    // 3. Verify Hash(studentId, secret) == commitment
    component hasher = Poseidon(2);
    hasher.inputs[0] <== studentId;
    hasher.inputs[1] <== secret;

    commitment <== hasher.out;
}