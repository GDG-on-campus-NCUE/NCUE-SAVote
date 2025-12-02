pragma circom 2.0.0;

include "vote.circom";

// Main component
// Depth 20 supports 2^20 (~1 million) voters
component main {public [root, electionId, vote]} = Vote(20);
