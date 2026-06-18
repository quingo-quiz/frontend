// src/lib/mocks/quizzes.ts
// Временные данные для разработки UI, пока main-service не готов.
// Заменить на quizService.* как только появятся реальные эндпоинты.
import type { Quiz, QuizSummary } from '$lib/types/quiz';

export const mockQuizzes: QuizSummary[] = [
    {
        id: 'q-1001',
        title: 'JavaScript Fundamentals',
        description: 'Проверь базовые знания JS: типы, замыкания, промисы и асинхронность.',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        cardCount: 12,
        updatedAt: '2026-06-15T10:20:00Z'
    },
    {
        id: 'q-1002',
        title: 'История Древнего Рима',
        description: 'От основания города до падения империи — ключевые даты и личности.',
        status: 'PUBLISHED_WITH_DRAFT',
        visibility: 'PUBLIC',
        cardCount: 20,
        updatedAt: '2026-06-16T18:05:00Z'
    },
    {
        id: 'q-1003',
        title: 'Чёрный квиз без названия',
        description: '',
        status: 'UNPUBLISHED',
        visibility: 'PRIVATE',
        cardCount: 3,
        updatedAt: '2026-06-17T09:41:00Z'
    },
    {
        id: 'q-1004',
        title: 'Основы Kubernetes',
        description: 'Поды, сервисы, деплойменты и немного сетевой магии.',
        status: 'PUBLISHED',
        visibility: 'PRIVATE',
        cardCount: 8,
        updatedAt: '2026-06-10T14:00:00Z'
    }
];

// Полные объекты квизов для страницы редактора (mock).
export const mockQuizDetails: Record<string, Quiz> = {
    'q-1001': {
        id: 'q-1001',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        snapshot: {
            id: 's-1001',
            title: 'JavaScript Fundamentals',
            description: 'Проверь базовые знания JS: типы, замыкания, промисы и асинхронность.',
            publishedAt: '2026-06-15T10:20:00Z',
            cards: [
                {
                    id: 'c-1', position: 0, type: 'SINGLE_CHOICE', timerSeconds: 20,
                    questionText: 'Какой тип у значения NaN?',
                    options: [
                        { id: 'o-1', text: 'number', isCorrect: true },
                        { id: 'o-2', text: 'undefined', isCorrect: false },
                        { id: 'o-3', text: 'object', isCorrect: false }
                    ]
                },
                {
                    id: 'c-2', position: 1, type: 'MULTIPLE_CHOICE', timerSeconds: 30,
                    questionText: 'Что из этого — примитивы?',
                    options: [
                        { id: 'o-4', text: 'string', isCorrect: true },
                        { id: 'o-5', text: 'symbol', isCorrect: true },
                        { id: 'o-6', text: 'array', isCorrect: false }
                    ]
                }
            ]
        }
    },
    'q-1003': {
        id: 'q-1003',
        visibility: 'PRIVATE',
        status: 'UNPUBLISHED',
        draft: {
            id: 'd-1003',
            title: 'Чёрный квиз без названия',
            description: '',
            modifiedAt: '2026-06-17T09:41:00Z',
            cards: [
                {
                    id: 'c-10', position: 0, type: 'SINGLE_CHOICE', timerSeconds: 15,
                    questionText: 'Столица Франции?',
                    options: [
                        { id: 'o-10', text: 'Париж', isCorrect: true },
                        { id: 'o-11', text: 'Лион', isCorrect: false }
                    ]
                },
                {
                    id: 'c-11', position: 1, type: 'TEXT_INPUT', timerSeconds: 20,
                    questionText: 'Введите химический символ золота',
                    acceptedTexts: ['Au', 'au']
                },
                {
                    id: 'c-12', position: 2, type: 'MULTIPLE_CHOICE', timerSeconds: 25,
                    questionText: 'Выберите чётные числа',
                    options: [
                        { id: 'o-12', text: '2', isCorrect: true },
                        { id: 'o-13', text: '3', isCorrect: false },
                        { id: 'o-14', text: '4', isCorrect: true }
                    ]
                }
            ]
        }
    }
};

export function getMockQuiz(id: string): Quiz | undefined {
    return mockQuizDetails[id];
}
