import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as fs from 'fs';

jest.mock('fs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'user-id', type: 'refresh', jti: 'jti' })),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'JWT_PRIVATE_KEY_PATH') return 'dummy-path';
      return null;
    }),
  };

  beforeEach(async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('dummy-private-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleSAMLLogin', () => {
    it('should create user and return tokens with isNewUser flag', async () => {
      const profile = {
        issuer: 'issuer',
        sessionIndex: 'idx',
        nameID: 'student1',
        nameIDFormat: 'fmt',
        studentId: 'student1',
        class: 'class1',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        studentIdHash: 'hash',
        class: 'class1',
        email: null,
        enrollmentStatus: 'ACTIVE',
      });
      mockPrismaService.session.create.mockResolvedValue({});

      const result = await service.handleSAMLLogin(profile, '127.0.0.1', 'agent');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user-id');
      expect(result.isNewUser).toBe(true);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.session.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const basePayload = {
      sub: 'user-id',
      type: 'refresh',
      jti: 'jti',
      studentIdHash: 'hash',
      class: 'CSIE',
    };

    it('should revoke expired sessions before throwing error', async () => {
      mockJwtService.verify.mockReturnValue(basePayload);
      mockPrismaService.session.findUnique.mockResolvedValue({
        jti: 'jti',
        userId: 'user-id',
        user: {},
        revoked: false,
        expiresAt: new Date(Date.now() - 1000),
        refreshToken: 'refresh-token',
      });

      await expect(
        service.refreshTokens('refresh-token', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jti: 'jti' },
          data: expect.objectContaining({ revoked: true }),
        }),
      );
    });
  });
});
