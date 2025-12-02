import { Test, TestingModule } from '@nestjs/testing';
import { ElectionsController } from '../../src/elections/elections.controller';
import { ElectionsService } from '../../src/elections/elections.service';
import { CandidatesService } from '../../src/elections/candidates.service';
import { CreateCandidateDto } from '../../src/elections/dto/create-candidate.dto';
import { UpdateCandidateDto } from '../../src/elections/dto/update-candidate.dto';

describe('ElectionsController (Candidates)', () => {
  let controller: ElectionsController;
  let candidatesService: CandidatesService;

  const mockElectionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCandidatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionsController],
      providers: [
        { provide: ElectionsService, useValue: mockElectionsService },
        { provide: CandidatesService, useValue: mockCandidatesService },
      ],
    }).compile();

    controller = module.get<ElectionsController>(ElectionsController);
    candidatesService = module.get<CandidatesService>(CandidatesService);
    jest.clearAllMocks();
  });

  describe('createCandidate', () => {
    it('should call candidatesService.create', async () => {
      const electionId = 'election-1';
      const dto: CreateCandidateDto = {
        name: 'Candidate A',
        bio: 'Bio A',
        photoUrl: 'http://example.com/photo.jpg',
      };
      const expectedResult = { id: 'cand-1', ...dto, electionId };

      mockCandidatesService.create.mockResolvedValue(expectedResult);

      const result = await controller.createCandidate(electionId, dto);

      expect(candidatesService.create).toHaveBeenCalledWith(electionId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllCandidates', () => {
    it('should call candidatesService.findAll', async () => {
      const electionId = 'election-1';
      const expectedResult = [{ id: 'cand-1', name: 'Candidate A' }];

      mockCandidatesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAllCandidates(electionId);

      expect(candidatesService.findAll).toHaveBeenCalledWith(electionId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateCandidate', () => {
    it('should call candidatesService.update', async () => {
      const candidateId = 'cand-1';
      const dto: UpdateCandidateDto = { name: 'Updated Name' };
      const expectedResult = { id: candidateId, name: 'Updated Name' };

      mockCandidatesService.update.mockResolvedValue(expectedResult);

      const result = await controller.updateCandidate(candidateId, dto);

      expect(candidatesService.update).toHaveBeenCalledWith(candidateId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeCandidate', () => {
    it('should call candidatesService.remove', async () => {
      const candidateId = 'cand-1';
      const expectedResult = { success: true };

      mockCandidatesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.removeCandidate(candidateId);

      expect(candidatesService.remove).toHaveBeenCalledWith(candidateId);
      expect(result).toEqual(expectedResult);
    });
  });
});
