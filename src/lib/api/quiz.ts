// src/lib/api/quiz.ts
// Клиент main-service для работы с квизами. Контракт см. в quiz-api-contract.md.
// ВНИМАНИЕ: main-service ещё проектируется — пока страницы используют моки (см. $lib/mocks/quizzes).
import { env } from '$env/dynamic/public';
import { authorizedFetch } from './client';
import type { ApiResponse, ApiError } from '$lib/types/auth';
import type {
    Quiz, QuizSummary, QuizContent,
    CreateQuizRequest, UpdateQuizRequest, SaveDraftRequest, UUID
} from '$lib/types/quiz';

const SERVICE_URL = `${env.PUBLIC_API_URL}/quizzes`;

async function unwrap<T>(res: Response): Promise<T> {
    const result = await res.json();
    if (!res.ok) throw result as ApiError;
    return (result as ApiResponse<T>).data;
}

export const quizService = {
    // 3.1 Список моих квизов (лёгкая сводка)
    async list(): Promise<QuizSummary[]> {
        const res = await authorizedFetch(SERVICE_URL);
        return unwrap<QuizSummary[]>(res);
    },

    // 3.2 Создать квиз (пустой черновик)
    async create(data: CreateQuizRequest): Promise<Quiz> {
        const res = await authorizedFetch(SERVICE_URL, { method: 'POST', body: JSON.stringify(data) });
        return unwrap<Quiz>(res);
    },

    // 3.3 Получить квиз целиком (редактор / просмотр)
    async get(id: UUID): Promise<Quiz> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}`);
        return unwrap<Quiz>(res);
    },

    // 3.4 Изменить мета-данные квиза (title/description/visibility)
    async update(id: UUID, data: UpdateQuizRequest): Promise<Quiz> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        return unwrap<Quiz>(res);
    },

    // 3.5 Удалить квиз
    async remove(id: UUID): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json() as ApiError;
    },

    // 3.6 Начать редактирование опубликованного (черновик-копия снапшота)
    async startDraft(id: UUID): Promise<QuizContent> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}/draft`, { method: 'POST' });
        return unwrap<QuizContent>(res);
    },

    // 3.7 Сохранить черновик целиком (Save): полная замена содержимого
    async saveDraft(id: UUID, data: SaveDraftRequest): Promise<Quiz> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}/draft`, { method: 'PUT', body: JSON.stringify(data) });
        return unwrap<Quiz>(res);
    },

    // 3.8 Опубликовать (черновик → снапшот, строгая валидация на бэке)
    async publish(id: UUID): Promise<Quiz> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}/publish`, { method: 'POST' });
        return unwrap<Quiz>(res);
    },

    // 3.9 Отменить правки (выбросить черновик)
    async discardDraft(id: UUID): Promise<void> {
        const res = await authorizedFetch(`${SERVICE_URL}/${id}/draft`, { method: 'DELETE' });
        if (!res.ok) throw await res.json() as ApiError;
    }
};
