import { PUBLIC_API_URL } from '$env/static/public';
import { userContext } from '$lib/runes/user.svelte';
import type { AuthResponse, User } from '$lib/types/auth';
import { goto } from '$app/navigation';

const SERVICE_URL = `${PUBLIC_API_URL}/auth`;

/**
 * Вспомогательная функция для запросов с обработкой 401 (Refresh Token)
 */
async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Auth-Strategy': 'cookie'
    };

    let response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    // Если получили 401, пробуем обновиться один раз
    if (response.status === 401) {
        const refreshRes = await fetch(`${SERVICE_URL}/refresh`, {
            method: 'POST',
            headers: defaultHeaders
            // Тело пустое, так как используем куки (как обсуждали ранее)
        });

        if (refreshRes.ok) {
            // Если рефреш успешен, повторяем исходный запрос
            response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers }
            });
        } else {
            // Если и рефреш не помог — разлогиниваем и на выход
            userContext.logout();
            if (typeof window !== 'undefined') goto('/auth');
        }
    }

    return response;
}

export const authService = {
    async login(email: string, password: string) {
        const res = await fetch(`${SERVICE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();

        if (res.status === 403 && result.data?.mfaRequired) {
            sessionStorage.setItem('mfa_temp_token', result.data.mfaTempToken);
            sessionStorage.setItem('mfa_token_timestamp', Date.now().toString());
            return { mfaRequired: true };
        }
        if (!res.ok) throw result;
        return { mfaRequired: false };
    },

    async register(data: any) {
        const res = await fetch(`${SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return true; 
    },

    async verifyOtp(code: string, mfaTempToken: string) {
        const res = await fetch(`${SERVICE_URL}/mfa/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Auth-Strategy': 'cookie' },
            body: JSON.stringify({ code, mfaTempToken })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Invalid code');
        return result.data;
    },

    async fetchUserInfo(): Promise<User | null> {
        try {
            const res = await authorizedFetch(`${SERVICE_URL}/user/info`);
            if (!res.ok) return null;
            const result = await res.json();
            return result.data;
        } catch { return null; }
    },

    async logout() {
        try {
            await fetch(`${SERVICE_URL}/logout`, {
                method: 'POST',
                headers: { 'Auth-Strategy': 'cookie' }
            });
        } finally {
            userContext.logout();
        }
    },

    // НОВЫЙ МЕТОД: Отзыв всех сессий
    async logoutAll() {
        const res = await authorizedFetch(`${SERVICE_URL}/logout/all`, {
            method: 'POST'
        });
        if (!res.ok) throw await res.json();
        return true;
    },

    async getSessions() {
        const res = await authorizedFetch(`${SERVICE_URL}/tokens`);
        const result = await res.json();
        if (!res.ok) throw result;
        return result.data; 
    },

    async initMfaConnect() {
        const res = await authorizedFetch(`${SERVICE_URL}/mfa/otp/connect`, { method: 'POST' });
        const result = await res.json();
        if (!res.ok) throw result;
        return result.data;
    },

    async confirmMfaConnect(code: string) {
        const res = await authorizedFetch(`${SERVICE_URL}/mfa/otp/connect/confirm`, {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        const result = await res.json();
        if (!res.ok) throw result;
        return result;
    }
};