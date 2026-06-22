// src/lib/types/quiz.ts
// Доменная модель квизов main-service. Согласована с openapi-main.yaml.

export type UUID = string;

export type Visibility = 'PUBLIC' | 'PRIVATE';
// Историческое имя — оставляем как алиас, чтобы не плодить правки в импортах.
export type QuizVisibility = Visibility;

// Производный статус: публиковался ли квиз. Наличие незакоммиченных правок
// определяется отдельно — по полю Quiz.draft, а не статусом.
export type QuizStatus = 'UNPUBLISHED' | 'PUBLISHED';

export type CardType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT_INPUT';

// Вариант ответа для SINGLE/MULTIPLE.
// Сервер присваивает целочисленный id; локально (до сохранения) используем
// временные отрицательные id (см. newOptionId) — они нужны лишь как ключи.
export interface CardOption {
	id: number;
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
	modifiedAt?: string; // дата последнего изменения
	createdAt?: string; // дата создания
}

// Полный объект квиза (редактор / просмотр)
export interface Quiz {
	id: UUID;
	ownerId: UUID;
	visibility: Visibility;
	status: QuizStatus;
	draft: QuizContent | null; // черновик, виден только владельцу
	snapshot: QuizContent | null; // опубликованная версия
}

// Лёгкая сводка для списка «Мои квизы».
// Внимание: один квиз может присутствовать в списке дважды —
// сводкой черновика (UNPUBLISHED) и опубликованной версии (PUBLISHED) с тем же id.
export interface QuizSummary {
	id: UUID;
	title: string;
	description?: string;
	status: QuizStatus;
	visibility: Visibility;
	cardCount: number;
	modifiedAt: string;
	createdAt: string;
}

// Элемент публичного каталога (GET /catalog)
export interface CatalogItem {
	id: UUID;
	title: string;
	description?: string;
	cardCount: number;
	modifiedAt: string;
	createdAt: string;
	ownerId: UUID;
}

// Постраничный ответ каталога
export interface CatalogPage {
	items: CatalogItem[];
	page: number;
	size: number;
	total: number;
	totalPages: number;
}

// --- Запросы ---

export interface CreateQuizRequest {
	title: string;
	description?: string;
	visibility: Visibility;
}

// Изменение мета-данных квиза. По контракту — только видимость
// (title/description меняются через сохранение черновика).
export interface UpdateQuizRequest {
	visibility: Visibility;
}

// Тело карточки при сохранении черновика (без id/position — их назначает сервер,
// порядок определяется индексом в массиве)
export interface CardInput {
	type: CardType;
	questionText: string;
	timerSeconds: number;
	options?: Array<{ text: string; isCorrect: boolean }>; // SINGLE/MULTIPLE
	acceptedTexts?: string[]; // TEXT_INPUT
}

// Полная замена содержимого черновика (мягкая валидация — обязателен только title)
export interface SaveDraftRequest {
	title: string;
	description?: string;
	cards: CardInput[];
}
