import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OidcService, OidcType } from './oidc.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
  ApiResponse,
  JWTPayload,
} from '@savote/shared-types';
import { generators } from 'openid-client';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private oidcService: OidcService,
  ) {}

  /**
   * Voter Login Initiation
   */
  @Get('login')
  async login(@Req() req: Request, @Res() res: Response) {
    return this.initiateOidc(OidcType.VOTER, req, res);
  }

  /**
   * Admin Login Initiation
   */
  @Get('admin/login')
  async adminLogin(@Req() req: Request, @Res() res: Response) {
    return this.initiateOidc(OidcType.ADMIN, req, res);
  }

  private initiateOidc(type: OidcType, req: Request, res: Response) {
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const state = generators.state();

    const session = req.session as any;
    if (!session) {
      this.logger.error('Session not initialized');
      return res.status(500).send('Session not initialized');
    }

    session[`${type}_code_verifier`] = code_verifier;
    session[`${type}_state`] = state;

    try {
      const authorizationUrl = this.oidcService.getAuthorizationUrl(type, code_challenge, state);
      return res.redirect(authorizationUrl);
    } catch (error) {
      this.logger.error(`Failed to generate ${type} auth URL: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Voter Callback
   */
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(OidcType.VOTER, req, res);
  }

  /**
   * Admin Callback
   */
  @Get('admin/callback')
  async adminCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(OidcType.ADMIN, req, res);
  }

  private async handleCallback(type: OidcType, req: Request, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

    try {
      const session = req.session as any;
      const code_verifier = session?.[`${type}_code_verifier`];
      const state = session?.[`${type}_state`];

      if (!code_verifier || !state) throw new Error('Session expired or invalid state');
      delete session[`${type}_code_verifier`];
      delete session[`${type}_state`];

      const { userinfo } = await this.oidcService.exchangeCode(type, req, code_verifier, state);

      const loginResponse = type === OidcType.VOTER 
        ? await this.authService.handleVoterLogin(userinfo, ipAddress, userAgent)
        : await this.authService.handleAdminOIDCLogin(userinfo, ipAddress, userAgent);

      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${loginResponse.accessToken}&refreshToken=${loginResponse.refreshToken}&role=${loginResponse.user.role}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`${type} Callback failed: ${error.message}`);
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenRequest, @Req() req: Request): Promise<ApiResponse<RefreshTokenResponse>> {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
      const tokens = await this.authService.refreshTokens(body.refreshToken, ipAddress);
      return { success: true, data: tokens };
    } catch (error) {
      return { success: false, error: { code: 'REFRESH_TOKEN_INVALID', message: error.message } };
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request): Promise<ApiResponse<void>> {
    const payload = req.user as JWTPayload;
    await this.authService.revokeSession(payload.jti);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request): Promise<ApiResponse<any>> {
    const payload = req.user as JWTPayload;
    return {
      success: true,
      data: {
        id: payload.sub,
        studentIdHash: payload.studentIdHash,
        class: payload.class,
        role: payload.role,
      },
    };
  }
}
