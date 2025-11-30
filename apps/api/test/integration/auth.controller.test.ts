import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController Integration', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    handleSAMLLogin: jest.fn(),
    refreshTokens: jest.fn(),
    revokeSession: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('samlCallback', () => {
    it('should process SAML login and redirect', async () => {
      const mockUser = {
        id: 'user-id',
        studentIdHash: 'hash',
        class: 'class1',
      };
      const mockTokens = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: mockUser,
        isNewUser: true,
      };

      mockAuthService.handleSAMLLogin.mockResolvedValue(mockTokens);
      mockConfigService.get.mockReturnValue('http://frontend/callback');

      const req = {
        user: {
          nameID: 'student1',
        },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'agent' },
      };
      const res = {
        redirect: jest.fn(),
      };

      await controller.samlCallback(req as any, res as any);

      expect(mockAuthService.handleSAMLLogin).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/auth/callback')
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('accessToken=access')
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('isNewUser=1')
      );
    });
  });
});
