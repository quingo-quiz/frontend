// Общий HTTP-клиент для авторизованных запросов ко всем сервисам платформы (auth, quizzes, ...).
// Инкапсулирует cookie-стратегию и единый рефреш сессии при 401.
import { env } from '$env/dynamic/public';
import { goto } from '$app/navigation';
import { userContext } from '$lib/runes/user.svelte';

const AUTH_BASE = `${env.PUBLIC_API_URL}/auth`;

// Общий промис рефреша: параллельные 401-запросы дожидаются ОДНОГО рефреша,
// а не разлогинивают пользователя, пока рефреш ещё идёт.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(headers: Record<string, string>): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = fetch(`${AUTH_BASE}/refresh`, { method: 'POST', headers })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

export async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Auth-Strategy': 'cookie'
    };

    const doFetch = () => fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    let response = await doFetch();

    if (response.status === 401) {
        // Если рефреш уже идёт — дожидаемся его, не запуская второй и не разлогинивая раньше времени
        const refreshed = await refreshSession(defaultHeaders);

        if (refreshed) {
            // Повторяем исходный запрос с новыми куками
            response = await doFetch();
        } else {
            userContext.logout();
            if (typeof window !== 'undefined') goto('/auth');
            throw new Error('Session expired. Please log in again.');
        }
    }

    return response;
}
