import { Strategy } from '@node-saml/passport-saml';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export interface SAMLProfile {
    issuer: string;
    sessionIndex: string;
    nameID: string;
    nameIDFormat: string;
    nameQualifier?: string;
    spNameQualifier?: string;
    mail?: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
    uid?: string;
    // Custom attributes from Synology C2 Identity
    studentId?: string;
    class?: string;
}

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
    constructor(private configService: ConfigService) {
        const entryPoint = configService.get<string>('SAML_ENTRY_POINT');
        const issuer = configService.get<string>('SAML_ISSUER');
        const cert = configService.get<string>('SAML_CERT');
        
        console.log('SamlStrategy: Initializing with config:', {
            entryPoint,
            issuer,
            certLength: cert ? cert.length : 0,
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
        });

        super({
            entryPoint: entryPoint,
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
            issuer: issuer,
            cert: SamlStrategy.formatCert(cert || ''),
            acceptedClockSkewMs: 5000,
            disableRequestedAuthnContext: true,
            identifierFormat: null,
            // Security settings matching IdP configuration
            signatureAlgorithm: 'sha256',
            digestAlgorithm: 'sha256',
            wantAssertionsSigned: true,
            wantAuthnResponseSigned: true,
        });
    }

    private static formatCert(cert: string): string {
        if (!cert) return '';
        if (cert.includes('BEGIN CERTIFICATE')) return cert;
        return `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
    }

    async validate(profile: SAMLProfile): Promise<SAMLProfile> {
        // Basic validation - detailed processing in AuthService
        if (!profile.nameID) {
            throw new Error('SAML profile missing nameID');
        }
        return profile;
    }
}
