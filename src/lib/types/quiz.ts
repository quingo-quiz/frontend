// src/lib/types/quiz.ts
// Доменная модель квизов main-service (этап создания/редактирования/публикации).

export type UUID = string;

export type QuizVisibility = 'PUBLIC' | 'PRIVATE';

// Производный статус: зависит от наличия черновика и/или снапшота
export type QuizStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'PUBLISHED_WITH_DRAFT';

export type CardType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT_INPUT';

// Вариант ответа для SINGLE/MULTIPLE
export interface CardOption {
    id: UUID;
    text: string;
    isCorrect: boolean;
}

// Карточка (вопрос)
export interface Card {
    id: UUID;
    position: number; // порядок с 0
    type: CardType;
    questionText: string;
    timerSeconds: number;
    options?: CardOption[]; // для SINGLE_CHOICE / MULTIPLE_CHOICE
    acceptedTexts?: string[]; // для TEXT_INPUT
}

// Содержимое квиза — одинаковая структура у черновика и снапшота
export interface QuizContent {
    id: UUID;
    title: string;
    description?: string;
    cards: Card[];
    modifiedAt?: string; // у черновика
    publishedAt?: string; // у снапшота
}

// Полный объект квиза (редактор / просмотр)
export interface Quiz {
    id: UUID;
    ownerId?: UUID;
    visibility: QuizVisibility;
    status: QuizStatus;
    draft?: QuizContent;
    snapshot?: QuizContent;
}

// Лёгкая сводка для списка «Мои квизы»
export interface QuizSummary {
    id: UUID;
    title: string;
    description?: string;
    status: QuizStatus;
    visibility: QuizVisibility;
    cardCount: number;
    previewImageUrl?: string; // превью (пока заглушка — поля ещё нет в API)
    updatedAt?: string; // modifiedAt черновика или publishedAt снапшота
}

// --- Запросы ---

export interface CreateQuizRequest {
    title: string;
    description?: string;
    visibility: QuizVisibility;
}

// Мета-данные квиза (заголовок/описание снапшота + видимость)
export interface UpdateQuizRequest {
    title?: string;
    description?: string;
    visibility?: QuizVisibility;
}

// Тело карточки при сохранении черновика (без id — сервер источник истины по id)
export interface CardInput {
    type: CardType;
    questionText: string;
    timerSeconds: number;
    options?: Array<{ text: string; isCorrect: boolean }>;
    acceptedTexts?: string[];
}

// Сохранение черновика целиком (порядок карточек = порядок в массиве)
export interface SaveDraftRequest {
    title: string;
    description?: string;
    cards: CardInput[];
}
