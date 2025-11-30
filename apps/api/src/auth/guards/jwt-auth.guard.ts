import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';
import { JWTPayload } from '@savote/shared-types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private prisma: PrismaService) {
        super();
    }

    async canActivate(context: any): Promise<boolean> {
        // First check JWT validity
        const canActivate = await super.canActivate(context);
        if (!canActivate) {
            return false;
        }

        // Get validated payload from JWT strategy
        const request = context.switchToHttp().getRequest();
        const payload: JWTPayload = request.user;

        // Check if session is revoked
        const session = await this.prisma.session.findUnique({
            where: { jti: payload.jti },
            select: { revoked: true, expiresAt: true },
        });

        if (!session) {
            throw new UnauthorizedException('Session not found');
        }

        if (session.revoked) {
            throw new UnauthorizedException('Session has been revoked');
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedException('Session has expired');
        }

        // Update last activity
        await this.prisma.session.update({
            where: { jti: payload.jti },
            data: { lastActivityAt: new Date() },
        });

        return true;
    }
}
