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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SamlAuthGuard } from './guards/saml.guard';
import type {
    RefreshTokenRequest,
    RefreshTokenResponse,
    ApiResponse,
    JWTPayload,
} from '@savote/shared-types';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Initiate SAML SSO login
     * Redirects to IdP login page
     */
    @Get('saml/login')
    @UseGuards(SamlAuthGuard)
    async samlLogin() {
        // Guard handles redirect to IdP
    }

    /**
     * Dev-only: Mock login endpoint to bypass SAML
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
        const mockProfile = isAdminLogin ? {
            nameID: 'admin-user',
            email: 'admin@savote.org',
            displayName: 'Admin User',
            studentId: 'ADMIN001',
            class: 'ADMIN',
        } : {
            nameID: 'test-user-001',
            email: 'test@example.com',
            displayName: 'Test User',
            studentId: 'S123456789',
            class: 'CS-2025',
        };

        try {
            const loginResponse = await this.authService.handleSAMLLogin(
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
     * SAML callback endpoint
     * Processes SAML response and issues JWT tokens
     */
    @Post('saml/callback')
    @UseGuards(AuthGuard('saml'))
    @HttpCode(HttpStatus.OK)
    async samlCallback(@Req() req: Request, @Res() res: Response) {
        const profile = req.user as any; // SAMLProfile from strategy
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        try {
            const loginResponse = await this.authService.handleSAMLLogin(
                profile,
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
