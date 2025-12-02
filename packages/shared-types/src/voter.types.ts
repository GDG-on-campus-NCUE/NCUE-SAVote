
export interface Candidate {
    id: string;
    name: string;
    description?: string | null;
    electionId: string;
}

export interface Election {
    id: string;
    name: string;
    merkleRootHash: string | null;
    status: ElectionStatus;
    startTime: Date | null;
    endTime: Date | null;
    createdAt: Date;
    updatedAt: Date;
    candidates: Candidate[];
}

export enum ElectionStatus {
    DRAFT = 'DRAFT',
    REGISTRATION_OPEN = 'REGISTRATION_OPEN',
    VOTING_OPEN = 'VOTING_OPEN',
    VOTING_CLOSED = 'VOTING_CLOSED',
    TALLIED = 'TALLIED'
}

export interface EligibleVoter {
    id: string;
    electionId: string;
    studentId: string;
    class: string;
    createdAt: Date;
}

export interface VoterEligibilityRequest {
    electionId: string;
    studentId: string;
    class: string;
}

export interface VoterEligibilityResponse {
    eligible: boolean;
    election: Election | null;
    merkleRootHash: string | null;
    merkleProof: string[];
    leafIndex?: number;
    reason?: string;
}

export interface ZKProof {
    proof: string;
    publicSignals: string[];
}

export interface VoteSubmission {
    electionId: string;
    encryptedVote: string;
    zkProof: ZKProof;
    merkleProof: string[];
}

export interface ElectionState {
    elections: Election[];
    currentElection: Election | null;
    loading: boolean;
    error: string | null;
}
