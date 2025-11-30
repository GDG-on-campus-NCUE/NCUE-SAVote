import type { ApiResponse, VoterEligibilityResponse } from '@savote/shared-types';
import { API_ENDPOINTS } from '../../../lib/constants';
import { api } from './auth.api';

export interface ImportVotersResponse {
  votersImported: number;
  duplicatesSkipped: number;
  merkleRootHash: string;
}

interface ImportVotersPayload {
  electionId: string;
  file: File;
}

export const voterApi = {
  async importVoters({ electionId, file }: ImportVotersPayload): Promise<ImportVotersResponse> {
    const formData = new FormData();
    formData.append('electionId', electionId);
    formData.append('file', file);

    const response = await api.post<ApiResponse<ImportVotersResponse>>(
      API_ENDPOINTS.VOTERS.IMPORT,
      formData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.code ?? 'IMPORT_FAILED');
    }

    return response.data.data;
  },

  async verifyEligibility(electionId: string): Promise<VoterEligibilityResponse> {
    const response = await api.post<ApiResponse<VoterEligibilityResponse>>(
      API_ENDPOINTS.VOTERS.VERIFY,
      { electionId }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.code ?? 'VERIFY_FAILED');
    }

    return response.data.data;
  },
};
