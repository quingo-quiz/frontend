// src/lib/utils/quiz.ts
import type { Card, CardType, QuizStatus } from '$lib/types/quiz';

// Для фронта различаем только два состояния: «черновик» и «опубликован».
// Черновик — всё, где есть незакоммиченные правки (UNPUBLISHED и PUBLISHED_WITH_DRAFT).
// Чисто опубликованным считается только PUBLISHED.
export function isDraft(status: QuizStatus): boolean {
	return status !== 'PUBLISHED';
}

// Лимиты из доменной модели
export const MAX_CARDS = 60;
export const MIN_TIMER = 1;
export const MAX_TIMER = 60;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 8;
export const DEFAULT_TIMER = 20;

export function newId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Фабрика новой карточки выбранного типа
export function createCard(type: CardType, position: number): Card {
	const base = { id: newId(), position, type, questionText: '', timerSeconds: DEFAULT_TIMER };
	if (type === 'TEXT_INPUT') {
		return { ...base, acceptedTexts: [''] };
	}
	return {
		...base,
		options: [
			{ id: newId(), text: '', isCorrect: false },
			{ id: newId(), text: '', isCorrect: false }
		]
	};
}

// Смена типа карточки: полностью сбрасывает содержимое (id и position сохраняются).
export function changeCardType(card: Card, type: CardType): Card {
	const base = { id: card.id, position: card.position, type, questionText: '', timerSeconds: DEFAULT_TIMER };
	if (type === 'TEXT_INPUT') {
		return { ...base, acceptedTexts: [''] };
	}
	return {
		...base,
		options: [
			{ id: newId(), text: '', isCorrect: false },
			{ id: newId(), text: '', isCorrect: false }
		]
	};
}

// Возвращает текст ошибки или null, если карточка полностью валидна (для публикации).
// Черновик можно сохранять и с невалидными карточками — см. canSaveDraft.
export function validateCard(card: Card): string | null {
	if (!card.questionText.trim()) return 'Question text is required';
	if (!card.timerSeconds || card.timerSeconds < MIN_TIMER || card.timerSeconds > MAX_TIMER)
		return `Timer must be between ${MIN_TIMER} and ${MAX_TIMER} seconds`;

	if (card.type === 'TEXT_INPUT') {
		const valid = (card.acceptedTexts ?? []).filter((t) => t.trim().length > 0);
		if (valid.length < 1) return 'Add at least one accepted answer';
		return null;
	}

	const options = card.options ?? [];
	if (options.length < MIN_OPTIONS) return `Add at least ${MIN_OPTIONS} options`;
	if (options.length > MAX_OPTIONS) return `No more than ${MAX_OPTIONS} options`;
	if (options.some((o) => !o.text.trim())) return 'All options must have text';

	const correct = options.filter((o) => o.isCorrect).length;
	if (card.type === 'SINGLE_CHOICE' && correct !== 1) return 'Mark exactly one correct option';
	if (card.type === 'MULTIPLE_CHOICE' && correct < 1) return 'Mark at least one correct option';

	return null;
}

export function isCardValid(card: Card): boolean {
	return validateCard(card) === null;
}
