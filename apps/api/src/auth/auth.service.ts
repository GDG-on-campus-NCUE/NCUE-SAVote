import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginResponse,
  JWTPayload,
  EnrollmentStatus,
  RefreshTokenResponse,
  UserRole,
} from '@savote/shared-types';
import { UserinfoResponse } from 'openid-client';
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
    const privateKeyPath = path.resolve(
      process.cwd(),
      this.configService.get<string>('JWT_PRIVATE_KEY_PATH') || './secrets/jwt-private.key',
    );
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }

  /**
   * Process Voter OIDC login
   */
  async handleVoterLogin(
    userinfo: UserinfoResponse,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponse> {
    const studentId = userinfo.preferred_username || userinfo.sub;
    if (!studentId) throw new UnauthorizedException('Student ID not found in OIDC info');

    const userClass = (userinfo['class'] || userinfo['ou'] || 'UNKNOWN') as string;
    const email = userinfo.email || null;
    const name = userinfo.name || userinfo.preferred_username || null;
    const studentIdHash = crypto.createHash('sha256').update(studentId).digest('hex');

    const existingUser = await this.prisma.user.findUnique({ where: { studentIdHash } });
    const isNewUser = !existingUser;

    let user = existingUser;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          studentIdHash,
          class: userClass,
          email,
          name,
          role: UserRole.USER,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { class: userClass, email: email || user.email, name: name || user.name },
      });
    }

    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return {
      ...tokens,
      isNewUser,
      user: this.mapToUserProfile(user, ipAddress),
    };
  }

  /**
   * Process Admin OIDC login (Synology)
   */
  async handleAdminOIDCLogin(
    userinfo: UserinfoResponse,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponse> {
    const synologySub = userinfo.sub;
    if (!synologySub) throw new UnauthorizedException('Synology Sub not found');

    // 1. Check local permission table
    const permission = await this.prisma.adminPermission.findUnique({
      where: { synologySub },
    });

    if (!permission) {
      this.logger.warn(`Unauthorized admin login attempt for sub: ${synologySub}`);
      throw new UnauthorizedException('You do not have administrative access to this system.');
    }

    // 2. Sync with User table
    let user = await this.prisma.user.findUnique({ where: { synologySub } });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          synologySub,
          name: permission.name || userinfo.name || 'Admin',
          email: userinfo.email || null,
          role: permission.role,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: permission.role,
          name: permission.name || userinfo.name || user.name,
          lastLoginIp: ipAddress,
        },
      });
    }

    // 3. Log admin login
    await this.prisma.adminLoginLog.create({
      data: { userId: user.id, ipAddress },
    });

    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return {
      ...tokens,
      isNewUser,
      user: this.mapToUserProfile(user, ipAddress),
    };
  }

  private mapToUserProfile(user: any, ip: string) {
    return {
      id: user.id,
      studentIdHash: user.studentIdHash,
      class: user.class,
      email: user.email,
      name: user.name,
      ip: ip,
      enrollmentStatus: user.enrollmentStatus as EnrollmentStatus,
      role: user.role as UserRole,
    };
  }

  async refreshTokens(refreshToken: string, ipAddress: string): Promise<RefreshTokenResponse> {
    try {
      const payload = this.jwtService.verify<JWTPayload>(refreshToken, {
        secret: this.privateKey,
        algorithms: ['RS256'],
      });

      const session = await this.prisma.session.findUnique({
        where: { jti: payload.jti },
        include: { user: true },
      });

      if (!session || session.revoked || session.expiresAt < new Date() || session.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const newJti = crypto.randomUUID();
      const accessToken = await this.signToken(session.user, newJti, 'access', '15m');
      const newRefreshToken = await this.signToken(session.user, newJti, 'refresh', '7d');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

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

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh failed');
    }
  }

  async revokeSession(jti: string): Promise<void> {
    await this.prisma.session.update({
      where: { jti },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredSessions() {
    await this.prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }] },
    });
  }

  private async generateTokens(user: any, ipAddress: string, deviceInfo: string) {
    const jti = crypto.randomUUID();
    const accessToken = await this.signToken(user, jti, 'access', '15m');
    const refreshToken = await this.signToken(user, jti, 'refresh', '7d');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: { userId: user.id, jti, accessToken, refreshToken, expiresAt, deviceInfo, ipAddress },
    });

    return { accessToken, refreshToken };
  }

  private async signToken(user: any, jti: string, type: 'access' | 'refresh', expiresIn: string) {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      jti,
      studentIdHash: user.studentIdHash,
      class: user.class,
      role: user.role as UserRole,
      type,
    };

    return this.jwtService.sign(payload, {
      privateKey: this.privateKey,
      algorithm: 'RS256',
      expiresIn,
    });
  }
}
