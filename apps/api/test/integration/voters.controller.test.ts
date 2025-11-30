import { Test, TestingModule } from '@nestjs/testing';
import { VotersController } from '../../src/voters/voters.controller';
import { VotersService } from '../../src/voters/voters.service';
import type { ApiResponse, VoterEligibilityResponse } from '@savote/shared-types';
import { ElectionStatus } from '@savote/shared-types';
import type { Express } from 'express';

describe('VotersController', () => {
  let controller: VotersController;
  const votersService = {
    importVoters: jest.fn(),
    verifyEligibility: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotersController],
      providers: [{ provide: VotersService, useValue: votersService }],
    }).compile();

    controller = module.get(VotersController);
    jest.clearAllMocks();
  });

  describe('importVoters', () => {
    it('returns service payload when file is provided', async () => {
      const file = { buffer: Buffer.from('csv') } as Express.Multer.File;
      const dto = { electionId: 'election-1' };
      votersService.importVoters.mockResolvedValue({
        votersImported: 2,
        duplicatesSkipped: 0,
        merkleRootHash: 'abc',
      });

      const response = await controller.importVoters(file, dto);

      expect(votersService.importVoters).toHaveBeenCalledWith('election-1', file.buffer);
      expect(response).toEqual<ApiResponse>({
        success: true,
        data: {
          votersImported: 2,
          duplicatesSkipped: 0,
          merkleRootHash: 'abc',
        },
      });
    });

    it('throws when file missing', async () => {
      await expect(controller.importVoters(undefined as any, { electionId: 'id' })).rejects.toThrow('CSV_FILE_REQUIRED');
    });
  });

  describe('verifyEligibility', () => {
    it('delegates to service with JWT payload', async () => {
      const dto = { electionId: 'election-1' };
      const req = { user: { studentIdHash: 'hash-1', class: 'CSIE_3A' } } as any;
      const eligibility: VoterEligibilityResponse = {
        eligible: true,
        election: {
          id: 'election-1',
          name: 'Student Council',
          merkleRootHash: 'abc',
          status: ElectionStatus.DRAFT,
          startTime: null,
          endTime: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        merkleRootHash: 'abc',
        merkleProof: ['proof'],
        leafIndex: 1,
      };
      votersService.verifyEligibility.mockResolvedValue(eligibility);

      const response = await controller.verifyEligibility(dto as any, req);

      expect(votersService.verifyEligibility).toHaveBeenCalledWith('election-1', 'hash-1', 'CSIE_3A');
      expect(response).toEqual<ApiResponse<VoterEligibilityResponse>>({ success: true, data: eligibility });
    });

    it('throws when JWT missing studentIdHash', async () => {
      const dto = { electionId: 'election-1' };
      const req = { user: { class: 'CSIE_3A' } } as any;

      await expect(controller.verifyEligibility(dto as any, req)).rejects.toThrow('STUDENT_ID_UNAVAILABLE');
    });
  });
});
