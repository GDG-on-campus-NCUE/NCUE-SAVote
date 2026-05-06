// The election rule winning threshold

export interface ElectionRule {
  quota: number;          // How many group need to be select
  thresholdRate?: number;  // The winning threshold
  walkoverThresholdRate?: number; // Specify walkover threshold
}

export const ELECTION_RULES: Record<string, ElectionRule> = {
  PRESIDENTIAL: {
    quota: 1,
    walkoverThresholdRate: 0.05,
  },
  DISTRICT_COUNCILOR: {
    quota: 1,
  },
  AT_LARGE_COUNCILOR: {
    quota: 16,
    thresholdRate: 0.01,
  },
};

export enum VOTE_RULES{
    BLANK_VOTE = "0" 
};
