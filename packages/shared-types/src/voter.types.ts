
export interface Candidate {
    id: string;
    name: string;
    bio?: string | null;
    photoUrl?: string | null;
    description?: string | null;
    electionId: string;
}

export enum ElectionType {
    PRESIDENTIAL = 'PRESIDENTIAL',
    DISTRICT_COUNCILOR = 'DISTRICT_COUNCILOR',
    AT_LARGE_COUNCILOR = 'AT_LARGE_COUNCILOR'
}

export interface Election {
    id: string;
    name: string;
    isVisible: boolean;
    status: ElectionStatus;
    type: ElectionType;
    config?: any;
    startTime: Date | null;
    endTime: Date | null;
    publicKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    candidates: Candidate[];
}

export enum ElectionStatus {
    DRAFT = 'DRAFT',
    REGISTRATION_OPEN = 'REGISTRATION_OPEN',
    VOTING_OPEN = 'VOTING_OPEN',
    VOTING_CLOSED = 'VOTING_CLOSED',
    TALLIED = 'TALLIED',
    FINISHED = "FINISHED"
}

export interface EligibleVoter {
    id: string;
    electionId: string;
    studentId: string;
    class: string;
    identityCommitment?: string | null;
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
    isRegistered: boolean;
    hasVoted: boolean;
    // merkleRootHash: string | null;
    // merkleProof: string[];
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
    //merkleProof: string[];
}

export interface ElectionState {
    elections: Election[];
    currentElection: Election | null;
    loading: boolean;
    error: string | null;
}

export interface VoteServiceTally {
    tally: Record<string, number>;
    totalVotes: number;
    totalEligibleVoters: number;
    candidates: (Candidate & { voteCount: number })[];
    result: {
        type?: string;
        winner?: Candidate;
        winners?: Candidate[];
        threshold?: number;
        tie?: boolean;
        note?: string;
        isElected?: boolean;
    };
}

export interface AdminSummaryResponse {
  election: Election;
  totalVotes: number;
  tally: VoteServiceTally;
}