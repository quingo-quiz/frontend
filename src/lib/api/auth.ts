// src/lib/api/auth.ts
import { PUBLIC_API_URL } from '$env/static/public';
import { userContext } from '$lib/runes/user.svelte';
import type { AuthResponse, User } from '$lib/types/auth';

/**
 * SERVICE_URL будет равен https://quingo.arhr.tech/api/auth
 * Все запросы этого сервиса идут через этот префикс
 */
const SERVICE_URL = `${PUBLIC_API_URL}/auth`;

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
        sessionStorage.setItem('mfa_token_timestamp', Date.now().toString()); // Сохраняем время
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
        
        if (!res.ok) {
            const result = await res.json();
            throw result;
        }
        // Мы не читаем result.data здесь, так как токены в куках
        return true; 
    },

    // 2. Верификация MFA OTP
    // Конечный путь: https://quingo.arhr.tech/api/auth/mfa/otp/verify
    async verifyOtp(code: string, mfaTempToken: string) {
        const res = await fetch(`${SERVICE_URL}/mfa/otp/verify`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Auth-Strategy': 'cookie' 
            },
            body: JSON.stringify({ code, mfaTempToken })
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || 'Неверный код');
        }

        return result.data;
    },

    // 3. Получение данных профиля (UserInfo)
    // Конечный путь: https://quingo.arhr.tech/api/auth/user/info
    async fetchUserInfo(): Promise<User | null> {
        try {
            const res = await fetch(`${SERVICE_URL}/user/info`, {
                headers: { 'Auth-Strategy': 'cookie' }
            });
            
            if (!res.ok) return null;
            
            const result = await res.json();
            return result.data;
        } catch (error) {
            console.error('Fetch user info error:', error);
            return null;
        }
    },

    // 4. Выход
    // Конечный путь: https://quingo.arhr.tech/api/auth/logout
    async logout() {
        try {
            await fetch(`${SERVICE_URL}/logout`, {
                method: 'POST',
                headers: { 'Auth-Strategy': 'cookie' }
            });
        } finally {
            // В любом случае очищаем состояние на фронте
            userContext.logout();
        }
    }
};