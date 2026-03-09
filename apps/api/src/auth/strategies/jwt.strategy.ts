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
      configService.get<string>('JWT_PUBLIC_KEY_PATH') ||
        './secrets/jwt-public.key',
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

    // Basic validation - sub and jti are mandatory for everyone
    if (!payload.sub || !payload.jti) {
      throw new UnauthorizedException('Invalid token payload: missing sub or jti');
    }

    // For non-admin roles, studentIdHash is usually required for voter eligibility
    // However, if the payload is validly signed, we can trust the sub mapping.
    // Let's ensure the payload at least has the essential fields.
    if (payload.role === 'USER' && !payload.studentIdHash) {
      throw new UnauthorizedException('Invalid token payload: missing studentIdHash for voter');
    }

    return payload;
  }
}
