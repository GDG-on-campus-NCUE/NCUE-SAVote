
export interface User {
    id: string;
    studentIdHash: string;
    class: string;
    email: string | null;
    enrollmentStatus: EnrollmentStatus;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export enum EnrollmentStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    GRADUATED = 'GRADUATED'
}

export interface Session {
    id: string;
    userId: string;
    jti: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    revoked: boolean;
    revokedAt: Date | null;
    deviceInfo: string | null;
    ipAddress: string | null;
    createdAt: Date;
    lastActivityAt: Date;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
    isNewUser: boolean;
}

export interface UserProfile {
    id: string;
    studentIdHash: string;
    class: string;
    email: string | null;
    name: string | null;
    ip?: string;
    enrollmentStatus: EnrollmentStatus;
    role: UserRole;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface SAMLCallbackQuery {
    SAMLResponse: string;
    RelayState?: string;
}

export interface JWTPayload {
    sub: string; // user id
    jti: string; // session jti
    studentIdHash: string;
    class: string;
    role: UserRole;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
}

export interface AuthState {
    user: UserProfile | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}
