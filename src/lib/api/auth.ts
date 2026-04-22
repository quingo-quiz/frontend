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
    // 1. Вход (Email/Pass)
    // Конечный путь: https://quingo.arhr.tech/api/auth/auth
    async login(email: string, password: string): Promise<AuthResponse['data']> {
        const res = await fetch(`${SERVICE_URL}/auth`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Auth-Strategy': 'cookie' 
            },
            body: JSON.stringify({ email, password })
        });

        const result: AuthResponse = await res.json();

        // Обработка 403 (MFA Required) или 200 (Success)
        if (res.status === 403 || res.ok) {
            return result.data;
        }

        throw new Error(result.message || 'Ошибка входа');
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