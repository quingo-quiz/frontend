import { env } from '$env/dynamic/public';
import { userContext } from '$lib/runes/user.svelte';
import { authorizedFetch } from './client';
import type {
    AuthRequest, RegisterRequest, AuthResponseModel, OtpVerifyRequest, 
    OtpConnectDto, OtpDisableRequest, UpdateUserRequest, 
    ChangePasswordRequest, SetPasswordRequest, SendResetPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest,
    User, SessionModel, SecurityStatusDto 
} from '$lib/types/auth';
import type { ApiResponse, ApiError } from '$lib/types/auth';

const SERVICE_URL = `${env.PUBLIC_API_URL}/auth`;

export const authService = {
    async login(data: AuthRequest): Promise<{ mfaRequired: boolean }> {
        const res = await fetch(`${SERVICE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify(data)
        });
        const raw = await res.json();

        if (res.status === 403 && raw?.data?.mfaRequired) {
            sessionStorage.setItem('mfa_temp_token', raw.data.mfaTempToken || '');
            sessionStorage.setItem('mfa_token_timestamp', Date.now().toString());
            return { mfaRequired: true };
        }
        if (!res.ok) throw raw as ApiError;
        return { mfaRequired: false };
    },

    async register(data: RegisterRequest): Promise<void> {
        const res = await fetch(`${SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async verifyOtp(data: OtpVerifyRequest): Promise<void> {
        const res = await fetch(`${SERVICE_URL}/mfa/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async fetchUserInfo(): Promise<User | null> {
        try {
            const res = await authorizedFetch(`${SERVICE_URL}/user/me`);
            if (!res.ok) return null;
            const result: ApiResponse<User> = await res.json();
            return result.data;
        } catch (error) { 
            // При ошибке из authorizedFetch (например, сессия истекла), просто возвращаем null
            // Редирект уже произойдет внутри authorizedFetch
            return null; 
        }
    },

    async logout(): Promise<void> {
        try {
            await authorizedFetch(`${SERVICE_URL}/logout`, { method: 'POST' });
        } finally {
            userContext.logout();
        }
    },

    async logoutAll(): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/logout/all`, { method: 'POST' });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async revokeSingleSession(tokenId: string): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/logout/${tokenId}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async getSessions(): Promise<SessionModel[]> {
        const res = await authorizedFetch(`${SERVICE_URL}/sessions`);
        const result = await res.json();
        if (!res.ok) throw result as ApiError;
        return (result as ApiResponse<SessionModel[]>).data;
    },

    async initMfaConnect(): Promise<OtpConnectDto> {
        const res = await authorizedFetch(`${SERVICE_URL}/mfa/otp/connect`, { method: 'POST' });
        const result = await res.json();
        if (!res.ok) throw result as ApiError;
        return (result as ApiResponse<OtpConnectDto>).data;
    },

    async confirmMfaConnect(data: OtpVerifyRequest): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/mfa/otp/connect/confirm`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    

    async disableMfa(data: OtpDisableRequest): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/mfa/otp/disable`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async updateUserProfile(data: UpdateUserRequest): Promise<User> {
        const res = await authorizedFetch(`${SERVICE_URL}/user/me`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw result as ApiError;
        return (result as ApiResponse<User>).data;
    },

    async getSecurityStatus(): Promise<SecurityStatusDto> {
        const res = await authorizedFetch(`${SERVICE_URL}/user/security-status`);
        const result = await res.json();
        if (!res.ok) throw result as ApiError;
        return (result as ApiResponse<SecurityStatusDto>).data;
    },

    async changePassword(data: ChangePasswordRequest): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/user/password/change`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    async setPassword(data: SetPasswordRequest): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/user/password/set`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    // НОВОЕ: Отправка письма для сброса пароля (НЕ авторизованный запрос)
    async sendPasswordResetLink(data: SendResetPasswordRequest): Promise<void> {
        const res = await fetch(`${SERVICE_URL}/user/password/send-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    // НОВОЕ: Сброс пароля (НЕ авторизованный запрос)
    async resetPassword(data: ResetPasswordRequest): Promise<void> {
        const res = await fetch(`${SERVICE_URL}/user/password/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },
    
    // НОВОЕ: Подтверждение email (НЕ авторизованный запрос, т.к. может быть без сессии)
    async verifyEmail(data: VerifyEmailRequest): Promise<void> {
        const res = await fetch(`${SERVICE_URL}/user/email/verify`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json() as ApiError;
    },

    // НОВОЕ: Повторная отправка письма подтверждения email
    // Это действие требует авторизации, поэтому используем authorizedFetch
    async resendEmailVerification(): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/user/email/verify/resend`, {
            method: 'POST'
        });
        if (!res.ok) throw await res.json() as ApiError;
    },
};