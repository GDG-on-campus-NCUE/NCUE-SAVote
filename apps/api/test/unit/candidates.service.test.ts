import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from '../../src/elections/candidates.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    election: {
      findUnique: jest.fn(),
    },
    candidate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a candidate if election exists', async () => {
      const electionId = 'election-1';
      const dto = { name: 'Candidate A' };
      
      mockPrismaService.election.findUnique.mockResolvedValue({ id: electionId });
      mockPrismaService.candidate.create.mockResolvedValue({ id: 'cand-1', ...dto, electionId });

      const result = await service.create(electionId, dto);

      expect(prisma.election.findUnique).toHaveBeenCalledWith({ where: { id: electionId } });
      expect((prisma as any).candidate.create).toHaveBeenCalledWith({
        data: { ...dto, electionId },
      });
      expect(result).toEqual({ id: 'cand-1', ...dto, electionId });
    });

    it('should throw NotFoundException if election does not exist', async () => {
      mockPrismaService.election.findUnique.mockResolvedValue(null);

      await expect(service.create('invalid-id', { name: 'A' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return candidates for election', async () => {
      const electionId = 'election-1';
      const candidates = [{ id: 'c1', name: 'A' }];
      mockPrismaService.candidate.findMany.mockResolvedValue(candidates);

      const result = await service.findAll(electionId);

      expect((prisma as any).candidate.findMany).toHaveBeenCalledWith({
        where: { electionId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(candidates);
    });
  });

  describe('update', () => {
    it('should update candidate if exists', async () => {
      const id = 'c1';
      const dto = { name: 'New Name' };
      mockPrismaService.candidate.findUnique.mockResolvedValue({ id });
      mockPrismaService.candidate.update.mockResolvedValue({ id, ...dto });

      const result = await service.update(id, dto);

      expect((prisma as any).candidate.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
      });
      expect(result).toEqual({ id, ...dto });
    });

    it('should throw NotFoundException if candidate not found', async () => {
      mockPrismaService.candidate.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete candidate if exists', async () => {
      const id = 'c1';
      mockPrismaService.candidate.findUnique.mockResolvedValue({ id });
      mockPrismaService.candidate.delete.mockResolvedValue({ id });

      const result = await service.remove(id);

      expect((prisma as any).candidate.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual({ success: true });
    });
  });
});
