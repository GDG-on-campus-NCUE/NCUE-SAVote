import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
    LoginResponse,
    UserProfile,
    JWTPayload,
    EnrollmentStatus,
    RefreshTokenResponse,
} from '@savote/shared-types';
import { SAMLProfile } from './strategies/saml.strategy';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private privateKey: string;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // Load RSA private key for signing
        const privateKeyPath = path.resolve(
            process.cwd(),
            this.configService.get<string>('JWT_PRIVATE_KEY_PATH') || './secrets/jwt-private.key'
        );
        this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    }

    /**
     * Process SAML login and create/update user session
     */
    async handleSAMLLogin(
        profile: SAMLProfile,
        ipAddress: string,
        userAgent: string,
    ): Promise<LoginResponse> {
        this.logger.log(`Processing SAML login for studentId: ${profile.studentId || profile.uid || profile.nameID}`);
        // Extract student ID from SAML profile
        // Adjust attribute name based on actual IdP configuration
        const studentId = profile.studentId || profile.uid || profile.nameID;
        const userClass = profile.class || 'UNKNOWN';
        const email = profile.mail || null;

        if (!studentId) {
            this.logger.error('Student ID not found in SAML response');
            throw new UnauthorizedException('Student ID not found in SAML response');
        }

        // Hash student ID with SHA-256
        const studentIdHash = crypto.createHash('sha256').update(studentId).digest('hex');

        const existingUser = await this.prisma.user.findUnique({
            where: { studentIdHash },
        });

        const isNewUser = !existingUser;

        let user = existingUser;

        if (!user) {
            this.logger.log(`Creating new user for studentIdHash: ${studentIdHash}`);
            user = await this.prisma.user.create({
                data: {
                    studentIdHash,
                    class: userClass,
                    email,
                    enrollmentStatus: EnrollmentStatus.ACTIVE,
                },
            });
        } else {
            this.logger.log(`Updating existing user: ${user.id}`);
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    class: userClass,
                    email: email || user.email,
                },
            });
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, studentIdHash, userClass, ipAddress, userAgent);

        return {
            ...tokens,
            isNewUser,
            user: {
                id: user.id,
                studentIdHash: user.studentIdHash,
                class: user.class,
                email: user.email,
                enrollmentStatus: user.enrollmentStatus as EnrollmentStatus,
            },
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(refreshToken: string, ipAddress: string): Promise<RefreshTokenResponse> {
        try {
            // Verify refresh token
            const payload = this.jwtService.verify<JWTPayload>(refreshToken, {
                secret: this.privateKey,
                algorithms: ['RS256'],
            });

            if (payload.type !== 'refresh') {
                throw new UnauthorizedException('Invalid token type');
            }

            // Check session validity
            const session = await this.prisma.session.findUnique({
                where: { jti: payload.jti },
                include: { user: true },
            });

            if (!session) {
                this.logger.warn(`Session not found for JTI: ${payload.jti}`);
                throw new UnauthorizedException('Session not found');
            }

            if (session.revoked) {
                this.logger.warn(`Session revoked for JTI: ${payload.jti}`);
                throw new UnauthorizedException('Session has been revoked');
            }

            if (session.expiresAt < new Date()) {
                this.logger.warn(`Session expired for JTI: ${payload.jti}`);
                await this.autoRevokeExpiredSession(session.jti);
                throw new UnauthorizedException('Session has expired');
            }

            // Verify refresh token matches
            if (session.refreshToken !== refreshToken) {
                // Token reuse detected - revoke session
                this.logger.error(`Token reuse detected for JTI: ${session.jti}. Revoking session.`);
                await this.revokeSession(session.jti);
                throw new UnauthorizedException('Token reuse detected - session revoked');
            }

            // Generate new token pair
            const newJti = crypto.randomUUID();
            const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '15m';
            const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '7d';

            const accessToken = await this.generateAccessToken(
                session.userId,
                payload.studentIdHash,
                payload.class,
                newJti,
                accessTokenExpiresIn,
            );

            const newRefreshToken = await this.generateRefreshToken(
                session.userId,
                payload.studentIdHash,
                payload.class,
                newJti,
                refreshTokenExpiresIn,
            );

            // Update session with new tokens
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            await this.prisma.session.update({
                where: { jti: session.jti },
                data: {
                    jti: newJti,
                    accessToken,
                    refreshToken: newRefreshToken,
                    expiresAt,
                    lastActivityAt: new Date(),
                    ipAddress,
                },
            });

            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Refresh token failed: ${error.message}`);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Revoke a session (logout)
     */
    async revokeSession(jti: string): Promise<void> {
        this.logger.log(`Revoking session: ${jti}`);
        await this.prisma.session.update({
            where: { jti },
            data: {
                revoked: true,
                revokedAt: new Date(),
            },
        });
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllUserSessions(userId: string): Promise<void> {
        this.logger.log(`Revoking all sessions for user: ${userId}`);
        await this.prisma.session.updateMany({
            where: {
                userId,
                revoked: false,
            },
            data: {
                revoked: true,
                revokedAt: new Date(),
            },
        });
    }

    /**
     * Clean up expired sessions daily
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredSessions() {
        this.logger.log('Running daily session cleanup job');
        const result = await this.prisma.session.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revoked: true },
                ],
            },
        });
        this.logger.log(`Cleaned up ${result.count} expired/revoked sessions`);
    }

    /**
     * Generate access and refresh tokens with session tracking
     */
    private async generateTokens(
        userId: string,
        studentIdHash: string,
        userClass: string,
        ipAddress: string,
        deviceInfo: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const jti = crypto.randomUUID();
        const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '15m';
        const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '7d';

        const accessToken = await this.generateAccessToken(
            userId,
            studentIdHash,
            userClass,
            jti,
            accessTokenExpiresIn,
        );

        const refreshToken = await this.generateRefreshToken(
            userId,
            studentIdHash,
            userClass,
            jti,
            refreshTokenExpiresIn,
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Create session record
        await this.prisma.session.create({
            data: {
                userId,
                jti,
                accessToken,
                refreshToken,
                expiresAt,
                deviceInfo,
                ipAddress,
            },
        });

        return { accessToken, refreshToken };
    }

    private async autoRevokeExpiredSession(jti: string): Promise<void> {
        try {
            await this.prisma.session.update({
                where: { jti },
                data: {
                    revoked: true,
                    revokedAt: new Date(),
                },
            });
        } catch {
            // Swallow errors to avoid leaking implementation details during refresh attempts
        }
    }

    private async generateAccessToken(
        userId: string,
        studentIdHash: string,
        userClass: string,
        jti: string,
        expiresIn: string,
    ): Promise<string> {
        const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            sub: userId,
            jti,
            studentIdHash,
            class: userClass,
            type: 'access',
        };

        return this.jwtService.sign(payload, {
            privateKey: this.privateKey,
            algorithm: 'RS256',
            expiresIn,
        });
    }

    private async generateRefreshToken(
        userId: string,
        studentIdHash: string,
        userClass: string,
        jti: string,
        expiresIn: string,
    ): Promise<string> {
        const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
            sub: userId,
            jti,
            studentIdHash,
            class: userClass,
            type: 'refresh',
        };

        return this.jwtService.sign(payload, {
            privateKey: this.privateKey,
            algorithm: 'RS256',
            expiresIn,
        });
    }
}
