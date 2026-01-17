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
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OidcService } from './oidc.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type {
    RefreshTokenRequest,
    RefreshTokenResponse,
    ApiResponse,
    JWTPayload,
} from '@savote/shared-types';
import { AdminLoginDto } from './dto/admin-login.dto';
import { generators } from 'openid-client';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private authService: AuthService,
        private oidcService: OidcService,
    ) { }

    /**
     * Initiate OIDC login
     * Redirects to IdP login page
     */
    @Get('login')
    async login(@Req() req: Request, @Res() res: Response) {
        const code_verifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(code_verifier);
        const state = generators.state();

        // Store verifier and state in session
        if (req.session) {
            (req.session as any).code_verifier = code_verifier;
            (req.session as any).state = state;
        } else {
            this.logger.error('Session not initialized');
            return res.status(500).send('Internal Server Error: Session not initialized');
        }

        try {
            const authorizationUrl = this.oidcService.getAuthorizationUrl(code_challenge, state);
            return res.redirect(authorizationUrl);
        } catch (error) {
            this.logger.error(`Failed to generate authorization URL: ${error.message}`);
            return res.status(500).send('Internal Server Error');
        }
    }

    /**
     * Dev-only: Mock login endpoint to bypass OIDC
     * Creates a fake user session and redirects to frontend
     */
    @Get('dev/login')
    async devLogin(@Req() req: Request, @Res() res: Response) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(404).send('Not Found');
        }

        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // 檢查是否為管理員登入
        const isAdminLogin = req.query.admin === 'true';

        // Mock profile - 根據登入類型使用不同的帳號
        // Using OIDC-like structure for mock
        const mockProfile = isAdminLogin ? {
            sub: 'admin-user',
            email: 'admin@savote.org',
            preferred_username: 'ADMIN001',
            class: 'ADMIN',
        } : {
            sub: 'test-user-001',
            email: 'test@example.com',
            preferred_username: 'S123456789',
            class: 'CS-2025',
        };

        try {
            const loginResponse = await this.authService.handleOIDCLogin(
                mockProfile as any,
                ipAddress,
                userAgent,
            );

            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            const userStateFlag = loginResponse.isNewUser ? '1' : '0';
            const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${loginResponse.accessToken}&refreshToken=${loginResponse.refreshToken}&isNewUser=${userStateFlag}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * OIDC callback endpoint
     * Processes OIDC response code and issues JWT tokens
     */
    @Get('callback')
    async callback(@Req() req: Request, @Res() res: Response) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        try {
            const session = req.session as any;
            if (!session || !session.code_verifier || !session.state) {
                throw new Error('Session expired or invalid state');
            }

            const code_verifier = session.code_verifier;
            const state = session.state;
            
            // Clear verifier from session
            delete session.code_verifier;
            delete session.state;

            const { userinfo } = await this.oidcService.exchangeCode(req, code_verifier, state);

            const loginResponse = await this.authService.handleOIDCLogin(
                userinfo,
                ipAddress,
                userAgent,
            );

            // Redirect to frontend with tokens in query params (or use session)
            // For security, consider using httpOnly cookies instead
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            const userStateFlag = loginResponse.isNewUser ? '1' : '0';
            const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${loginResponse.accessToken}&refreshToken=${loginResponse.refreshToken}&isNewUser=${userStateFlag}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            this.logger.error(`OIDC Callback failed: ${error.message}`);
            // Redirect to error page
            const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * Refresh access token using refresh token
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() body: RefreshTokenRequest,
        @Req() req: Request,
    ): Promise<ApiResponse<RefreshTokenResponse>> {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

        try {
            const tokens = await this.authService.refreshTokens(body.refreshToken, ipAddress);
            return {
                success: true,
                data: tokens,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'REFRESH_TOKEN_INVALID',
                    message: error.message,
                },
            };
        }
    }

    /**
     * Logout - revoke current session
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request): Promise<ApiResponse<void>> {
        const payload = req.user as JWTPayload;

        await this.authService.revokeSession(payload.jti);

        return {
            success: true,
        };
    }

    /**
     * Logout from all devices - revoke all sessions
     */
    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logoutAll(@Req() req: Request): Promise<ApiResponse<void>> {
        const payload = req.user as JWTPayload;

        await this.authService.revokeAllUserSessions(payload.sub);

        return {
            success: true,
        };
    }

    /**
     * Get current user profile
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@Req() req: Request): Promise<ApiResponse<any>> {
        const payload = req.user as JWTPayload;

        // Return user info from token payload
        return {
            success: true,
            data: {
                id: payload.sub,
                studentIdHash: payload.studentIdHash,
                class: payload.class,
            },
        };
    }

    /**
     * Admin login with username and password
     * Real production admin authentication endpoint
     */
    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    async adminLogin(
        @Body() dto: AdminLoginDto,
        @Req() req: Request,
    ): Promise<ApiResponse<any>> {
        const ipAddress = req.ip || (req.socket as any).remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        try {
            const loginResponse = await this.authService.handleAdminLogin(
                dto.username,
                dto.password,
                ipAddress,
                userAgent,
            );

            return {
                success: true,
                data: loginResponse,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: error.message || 'Invalid username or password',
                },
            };
        }
    }
}
