import { api } from './auth.api';

export interface Candidate {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  electionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateRequest {
  name: string;
  bio?: string;
  photoUrl?: string;
}

export interface UpdateCandidateRequest {
  name?: string;
  bio?: string;
  photoUrl?: string;
}

export const candidateApi = {
  create: async (electionId: string, data: CreateCandidateRequest | FormData) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post<Candidate>(`/elections/${electionId}/candidates`, data, config);
    return response.data;
  },

  findAll: async (electionId: string) => {
    const response = await api.get<Candidate[]>(`/elections/${electionId}/candidates`);
    return response.data;
  },

  update: async (id: string, data: UpdateCandidateRequest) => {
    const response = await api.patch<Candidate>(`/elections/candidates/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/elections/candidates/${id}`);
    return response.data;
  },
};
