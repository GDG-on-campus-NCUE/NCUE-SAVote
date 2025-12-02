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

        console.log('SamlStrategy: Initializing with config (no signature validation for dev):', {
            entryPoint,
            issuer,
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
        });

        // Dev-only: disable signature validation entirely to avoid OpenSSL issues.
        // DO NOT use this configuration in production.
        
        // Generate a dummy self-signed certificate that won't cause OpenSSL parser errors
        // This is a valid PEM format but won't be used for actual verification
        const dummyCert = `-----BEGIN CERTIFICATE-----
MIICmzCCAYMCBgGTt9sxKjANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZkdW1t
eTAeFw0yNTEyMDEwMDAwMDBaFw0zNTEyMDEwMDAwMDBaMBExDzANBgNVBAMMBmR1
bW15MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0p2CpyPuRH4bP0Tc
aA8iLkCFmxPJUqXhqGZ9RLx4q1VqDkAzZs7fJ0OqLAb8+kO7p2FQKW9FI8q8+r5Q
mXQ7Y9pU8J0vqW9K5H7L9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q
5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5
V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5V
3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8QIDAQAB
MA0GCSqGSIb3DQEBCwUAA4IBAQCp8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K
9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9Q5V3Q8Z9sA6V5R9L0P8K9
-----END CERTIFICATE-----`;

        super({
            entryPoint: entryPoint,
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
            issuer: issuer,
            cert: dummyCert,
            acceptedClockSkewMs: 5000,
            disableRequestedAuthnContext: true,
            identifierFormat: null,
            // Set these to false to skip signature verification (dev only)
            wantAssertionsSigned: false,
            wantAuthnResponseSigned: false,
            validateInResponseTo: false,
            // Force skip all validation
            skipRequestCompression: true,
        });
    }

    private static formatCert(cert: string): string {
        if (!cert) return '';
        // Remove existing headers and all whitespace
        const cleanCert = cert.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, '');
        
        // Chunk into 64-char lines to ensure valid PEM format
        const chunkedCert = cleanCert.match(/.{1,64}/g)?.join('\n');
        
        return `-----BEGIN CERTIFICATE-----\n${chunkedCert}\n-----END CERTIFICATE-----`;
    }

    async validate(profile: any): Promise<any> {
        console.log('SAML Raw Profile:', JSON.stringify(profile, null, 2));

        // Map attributes based on Synology C2 Identity test configuration
        // The user configured: email, displayName, department
        const mappedProfile = {
            ...profile,
            email: profile.email || profile.mail || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            displayName: profile.displayName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
            // Map 'department' (from Synology) to 'class' (our app)
            class: profile.department || profile['urn:oid:2.5.4.11'],
            // Use nameID (Account) as studentId if uid is missing
            studentId: profile.uid || profile.nameID,
        };

        console.log('SAML Mapped Profile:', mappedProfile);

        if (!mappedProfile.nameID) {
            throw new Error('SAML profile missing nameID');
        }
        return mappedProfile;
    }
}
