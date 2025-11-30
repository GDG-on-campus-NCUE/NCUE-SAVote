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
}
