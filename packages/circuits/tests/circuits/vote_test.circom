pragma circom 2.0.0;

include "../../src/vote.circom";

component main {public [root, electionId, vote]} = Vote(2);
