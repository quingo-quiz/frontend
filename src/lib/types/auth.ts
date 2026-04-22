export interface User {
    id: string;
    username: string;
    email: string;
    roles: ('USER' | 'ADMIN')[];
    emailVerified: boolean;
    mfaEnabled: boolean;
    accountStatus: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

export interface AuthResponse {
    status: number;
    statusMessage: string;
    message: string;
    data: {
        accessToken?: string;
        refreshToken?: string;
        mfaTempToken?: string;
        mfaRequired: boolean;
    };
    timestamp: string;
}

export interface ApiError {
    status: number;
    message: string;
    fieldErrors?: Record<string, string>;
}