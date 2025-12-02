import { api } from '../../auth/services/auth.api';

export const votersApi = {
  registerCommitment: async (electionId: string, commitment: string) => {
    const res = await api.post('/voters/register-commitment', { electionId, commitment });
    return res.data as { success: boolean };
  },
};
