pragma circom 2.0.0;

include "vote.circom";

// Instantiate Vote circuit with tree depth 20
component main {public [root, electionId, vote, nullifierHash]} = Vote(20);