import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWTPayload } from '@savote/shared-types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private configService: ConfigService) {
        const publicKeyPath = path.resolve(
            process.cwd(),
            configService.get<string>('JWT_PUBLIC_KEY_PATH') || './secrets/jwt-public.key'
        );
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: publicKey,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: JWTPayload): Promise<JWTPayload> {
        // Verify token type is access token
        if (payload.type !== 'access') {
            throw new UnauthorizedException('Invalid token type');
        }

        // Basic validation - session revocation check will be in guard
        if (!payload.sub || !payload.jti || !payload.studentIdHash) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return payload;
    }
}
