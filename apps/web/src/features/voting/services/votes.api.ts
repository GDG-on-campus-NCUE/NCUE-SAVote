import { api } from '../../auth/services/auth.api';

export interface SubmitVoteRequest {
    electionId: string;
    vote: string;
    proof: any;
    publicSignals: string[];
}

export const votesApi = {
    submitVote: async (data: SubmitVoteRequest) => {
        const response = await api.post('/votes/submit', data);
        return response.data;
    },
};
