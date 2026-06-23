<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		ArrowRight,
		Plus,
		Globe,
		Lock,
		GripVertical,
		Trash2,
		Copy,
		Repeat2,
		ArrowUp,
		ArrowDown,
		MoreVertical,
		MoreHorizontal,
		Save,
		UploadCloud,
		ListChecks,
		CheckSquare,
		Type as TypeIcon,
		LayoutGrid
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import {
		isCardValid,
		createCard,
		changeCardType,
		newId,
		newOptionId,
		MAX_CARDS
	} from '$lib/utils/quiz';
	import { toasts } from '$lib/runes/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import CardEditor from '$lib/components/quiz/editor/CardEditor.svelte';
	import { quizService } from '$lib/api/quiz';
	import type {
		Quiz,
		QuizContent,
		Card,
		CardType,
		CardInput,
		Visibility,
		SaveDraftRequest
	} from '$lib/types/quiz';

	let id = $derived(page.params.id ?? '');

	let isLoading = $state(true);
	let loaded = $state(false);
	let loadError = $state<string | null>(null);
	let quiz = $state<Quiz | null>(null);

	// Рабочее состояние черновика (локально; на бэкенд — по кнопке Save)
	let title = $state('');
	let description = $state('');
	let visibility = $state<Visibility>('PRIVATE');
	let cards = $state<Card[]>([]);
	let selectedId = $state<string | null>(null);
	let isSaving = $state(false);
	let isPublishing = $state(false);

	// Видимость на сервере (чтобы понимать, нужен ли PATCH)
	let serverVisibility = $state<Visibility>('PRIVATE');
	// Опубликованный снапшот существует → это правка опубликованного квиза (можно Discard)
	let hasSnapshot = $derived(!!quiz?.snapshot);
	// Слепок состояния, синхронизированного с сервером — для определения «есть несохранённые правки»
	let baseline = $state('');

	let showMenu = $state(false);
	let showAddMenu = $state(false);
	let openCardMenu = $state<string | null>(null);
	let changeTypeCardId = $state<string | null>(null);
	let showDelete = $state(false);
	let isDeleting = $state(false);

	let selectedCard = $derived(cards.find((c) => c.id === selectedId) ?? null);
	let selectedIndex = $derived(cards.findIndex((c) => c.id === selectedId));

	// Черновик можно сохранять и частично невалидным; блок только без названия
	let saveBlockedReason = $derived(!title.trim() ? 'Quiz title is required' : null);

	// Полная валидация — для публикации
	let publishError = $derived.by(() => {
		if (!title.trim()) return 'Quiz title is required';
		if (cards.length < 1) return 'Add at least one card';
		if (cards.length > MAX_CARDS) return `Maximum ${MAX_CARDS} cards`;
		const badIdx = cards.findIndex((c) => !isCardValid(c));
		if (badIdx >= 0) return `Card ${badIdx + 1} needs attention`;
		return null;
	});

	const cardTypes: { type: CardType; label: string; icon: typeof ListChecks }[] = [
		{ type: 'SINGLE_CHOICE', label: 'Single choice', icon: ListChecks },
		{ type: 'MULTIPLE_CHOICE', label: 'Multiple choice', icon: CheckSquare },
		{ type: 'TEXT_INPUT', label: 'Text input', icon: TypeIcon }
	];
	function iconFor(type: CardType) {
		return cardTypes.find((t) => t.type === type)?.icon ?? ListChecks;
	}
	function labelFor(type: CardType) {
		return cardTypes.find((t) => t.type === type)?.label ?? '';
	}
	let changeTypeCard = $derived(cards.find((c) => c.id === changeTypeCardId) ?? null);

	const storageKey = (qid: string) => `quingo:draft:${qid}`;

	// Сериализация рабочего состояния (порядок ключей фиксирован для сравнения с baseline)
	function serialize(): string {
		return JSON.stringify({ title, description, visibility, cards });
	}

	// Есть ли несохранённые правки относительно сервера
	let dirty = $derived(loaded && serialize() !== baseline);

	// Загрузка содержимого квиза в рабочее состояние (глубокая копия — чтобы не мутировать quiz)
	function loadContent(content: QuizContent | null, vis: Visibility) {
		title = content?.title ?? '';
		description = content?.description ?? '';
		visibility = vis;
		cards = (content?.cards ?? []).map((c) => ({
			...c,
			// Бэкенд (Jackson) для boolean isCorrect может отдавать ключ `correct` —
			// нормализуем оба варианта, иначе галочки правильных ответов не подсветятся.
			options: c.options?.map((o) => ({
				...o,
				isCorrect: o.isCorrect ?? (o as any).correct ?? false
			})),
			acceptedTexts: c.acceptedTexts ? [...c.acceptedTexts] : undefined
		}));
	}

	// Принять ответ сервера как новую точку синхронизации
	function applyServer(q: Quiz) {
		quiz = q;
		serverVisibility = q.visibility;
		const prevIndex = selectedIndex;
		loadContent(q.draft, q.visibility);
		baseline = serialize();
		selectedId = cards[Math.min(Math.max(prevIndex, 0), cards.length - 1)]?.id ?? null;
	}

	// Сборка тела запроса сохранения черновика
	function toSaveRequest(): SaveDraftRequest {
		const cardInputs: CardInput[] = cards.map((c) => {
			const base: CardInput = {
				type: c.type,
				questionText: c.questionText,
				timerSeconds: c.timerSeconds
			};
			if (c.type === 'TEXT_INPUT') {
				base.acceptedTexts = [...(c.acceptedTexts ?? [])];
			} else {
				// Бэкенд (Jackson) читает boolean как `correct`; шлём оба ключа для надёжности.
				base.options = (c.options ?? []).map(
					(o) => ({ text: o.text, isCorrect: o.isCorrect, correct: o.isCorrect }) as any
				);
			}
			return base;
		});
		return { title: title.trim(), description: description.trim() || undefined, cards: cardInputs };
	}

	onMount(async () => {
		try {
			let q = await quizService.get(id);
			// Для редактирования нужен черновик: у опубликованного без черновика создаём копию снапшота
			if (!q.draft) {
				q = await quizService.startDraft(id);
			}
			quiz = q;
			serverVisibility = q.visibility;
			loadContent(q.draft, q.visibility);
			baseline = serialize();

			// Восстановление несохранённых правок после случайного обновления страницы
			const stored =
				typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey(id)) : null;
			if (stored && stored !== baseline) {
				try {
					const data = JSON.parse(stored);
					title = data.title ?? title;
					description = data.description ?? description;
					visibility = data.visibility ?? visibility;
					cards = (data.cards ?? []).map((c: Card) => ({ ...c }));
					toasts.show('Restored unsaved changes', 'info');
				} catch {
					/* битый кэш — игнорируем */
				}
			}

			selectedId = cards[0]?.id ?? null;
		} catch (e: any) {
			loadError = e?.message || 'Failed to load quiz';
			quiz = null;
		} finally {
			isLoading = false;
			loaded = true;
		}
	});

	// Кэш в localStorage хранит ТОЛЬКО несохранённые правки (для восстановления).
	// Совпало с сервером → чистим, чтобы наличие ключа однозначно значило «есть правки».
	$effect(() => {
		if (!loaded || !id) return;
		const current = serialize();
		try {
			if (current === baseline) localStorage.removeItem(storageKey(id));
			else localStorage.setItem(storageKey(id), current);
		} catch {
			/* ignore quota errors */
		}
	});

	function addCard(type: CardType) {
		if (cards.length >= MAX_CARDS) {
			toasts.show(`Maximum ${MAX_CARDS} cards reached`, 'error');
			return;
		}
		const card = createCard(type, cards.length);
		cards = [...cards, card];
		selectedId = card.id;
		showAddMenu = false;
	}

	function deleteCard(cardId: string) {
		const idx = cards.findIndex((c) => c.id === cardId);
		cards = cards.filter((c) => c.id !== cardId).map((c, i) => ({ ...c, position: i }));
		if (selectedId === cardId) selectedId = cards[Math.max(0, idx - 1)]?.id ?? null;
		openCardMenu = null;
	}

	function duplicateCard(cardId: string) {
		const src = cards.find((c) => c.id === cardId);
		if (!src) return;
		const copy: Card = {
			...src,
			id: newId(),
			options: src.options?.map((o) => ({ ...o, id: newOptionId() })),
			acceptedTexts: src.acceptedTexts ? [...src.acceptedTexts] : undefined
		};
		const idx = cards.findIndex((c) => c.id === cardId);
		const updated = [...cards];
		updated.splice(idx + 1, 0, copy);
		cards = updated.map((c, i) => ({ ...c, position: i }));
		selectedId = copy.id;
		openCardMenu = null;
	}

	// Перемещение карточки на одну позицию (для тач-устройств, где DnD недоступен)
	function moveCard(cardId: string, dir: -1 | 1) {
		const idx = cards.findIndex((c) => c.id === cardId);
		const next = idx + dir;
		if (idx < 0 || next < 0 || next >= cards.length) return;
		const updated = [...cards];
		[updated[idx], updated[next]] = [updated[next], updated[idx]];
		cards = updated.map((c, i) => ({ ...c, position: i }));
		selectedId = cardId;
		openCardMenu = null;
	}

	function applyChangeType(t: CardType) {
		const cid = changeTypeCardId;
		changeTypeCardId = null;
		if (!cid) return;
		cards = cards.map((c) => (c.id === cid ? changeCardType(c, t) : c));
		selectedId = cid;
	}

	// --- Drag & drop (живое перемещение: карточки сдвигаются прямо при перетаскивании) ---
	let dragIndex = $state<number | null>(null);

	function handleDragOver(overIndex: number) {
		if (dragIndex === null || dragIndex === overIndex) return;
		const updated = [...cards];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(overIndex, 0, moved);
		cards = updated.map((c, i) => ({ ...c, position: i }));
		dragIndex = overIndex; // продолжаем «вести» ту же карточку на новой позиции
		// Порядок уходит на бэкенд вместе с черновиком при Save (отдельного эндпоинта нет).
	}

	function endDrag() {
		dragIndex = null;
	}

	// --- Тач-перетаскивание (long-press): на мобилках/планшетах нет нативного DnD ---
	let touchDragActive = $state(false);
	let lpTimer: ReturnType<typeof setTimeout> | null = null;
	let lpStart = { x: 0, y: 0 };
	let lpEl: HTMLElement | null = null;
	let lpPointerId = 0;

	function cancelLongPress() {
		if (lpTimer) {
			clearTimeout(lpTimer);
			lpTimer = null;
		}
	}

	function cardPointerDown(e: PointerEvent, card: Card, i: number) {
		if (e.pointerType !== 'touch') return; // мышь использует нативный DnD
		lpStart = { x: e.clientX, y: e.clientY };
		lpEl = e.currentTarget as HTMLElement;
		lpPointerId = e.pointerId;
		cancelLongPress();
		lpTimer = setTimeout(() => {
			touchDragActive = true;
			dragIndex = i;
			selectedId = card.id;
			openCardMenu = null;
			try {
				lpEl?.setPointerCapture(lpPointerId);
			} catch {
				/* noop */
			}
			try {
				navigator.vibrate?.(10);
			} catch {
				/* noop */
			}
		}, 220);
	}

	function cardPointerMove(e: PointerEvent) {
		if (e.pointerType !== 'touch') return;
		if (!touchDragActive) {
			// Палец поехал до срабатывания long-press → это скролл, отменяем драг
			if (Math.abs(e.clientX - lpStart.x) > 8 || Math.abs(e.clientY - lpStart.y) > 8)
				cancelLongPress();
			return;
		}
		const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
			'[data-card-index]'
		) as HTMLElement | null;
		if (el) {
			const overIndex = Number(el.dataset.cardIndex);
			if (!Number.isNaN(overIndex)) handleDragOver(overIndex);
		}
	}

	function cardPointerUp() {
		cancelLongPress();
		if (touchDragActive) {
			touchDragActive = false;
			endDrag();
		}
	}

	// Блокируем прокрутку контейнера, только пока идёт тач-драг (listener non-passive)
	function dragScrollGuard(node: HTMLElement) {
		function onTouchMove(e: TouchEvent) {
			if (touchDragActive) e.preventDefault();
		}
		node.addEventListener('touchmove', onTouchMove, { passive: false });
		return {
			destroy() {
				node.removeEventListener('touchmove', onTouchMove);
			}
		};
	}

	// --- Действия ---
	// Сохранить черновик: при необходимости PATCH видимости + PUT всего содержимого
	async function handleSave(): Promise<boolean> {
		if (saveBlockedReason) {
			toasts.show(saveBlockedReason, 'error');
			return false;
		}
		isSaving = true;
		try {
			if (visibility !== serverVisibility) {
				await quizService.update(id, { visibility });
				serverVisibility = visibility;
			}
			const updated = await quizService.saveDraft(id, toSaveRequest());
			applyServer(updated);
			toasts.show('Draft saved', 'success');
			return true;
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to save draft', 'error');
			return false;
		} finally {
			isSaving = false;
		}
	}

	// Опубликовать: строгая клиентская валидация → сохраняем актуальный черновик → publish
	async function handlePublish() {
		if (publishError) {
			const badIdx = cards.findIndex((c) => !isCardValid(c));
			if (badIdx >= 0) selectedId = cards[badIdx].id; // переводим к проблемной карточке
			toasts.show(publishError, 'error');
			return;
		}
		isPublishing = true;
		try {
			if (visibility !== serverVisibility) {
				await quizService.update(id, { visibility });
				serverVisibility = visibility;
			}
			await quizService.saveDraft(id, toSaveRequest());
			await quizService.publish(id);
			baseline = serialize();
			try {
				localStorage.removeItem(storageKey(id));
			} catch {
				/* noop */
			}
			toasts.show('Quiz published', 'success');
			goto('/quizzes');
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to publish quiz', 'error');
		} finally {
			isPublishing = false;
		}
	}

	// В редакторе всегда работаем с черновиком:
	// у опубликованного квиза Delete выбрасывает только черновик (снапшот остаётся),
	// у нового (без снапшота) — удаляет квиз целиком.
	async function handleDelete() {
		isDeleting = true;
		try {
			if (hasSnapshot) await quizService.discardDraft(id);
			else await quizService.remove(id);
			baseline = serialize();
			try {
				localStorage.removeItem(storageKey(id));
			} catch {
				/* noop */
			}
			toasts.show(hasSnapshot ? 'Draft deleted' : 'Quiz deleted', 'success');
			goto('/quizzes');
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to delete', 'error');
		} finally {
			isDeleting = false;
			showDelete = false;
		}
	}

	// Видимость меняем локально (на бэк уйдёт PATCH'ем при Save).
	// Если есть опубликованная версия — менять нельзя: это свойство всего квиза,
	// смена затронула бы и опубликованную версию. Делается через каталог.
	function toggleVisibility() {
		if (hasSnapshot) return;
		visibility = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		showMenu = false;
	}

	function selectCardKey(e: KeyboardEvent, cardId: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectedId = cardId;
		}
	}
</script>

<svelte:window
	onclick={() => {
		showAddMenu = false;
		showMenu = false;
		openCardMenu = null;
	}}
/>

<svelte:head><title>{title.trim() ? `${title} · Quingo` : 'Edit Quiz · Quingo'}</title></svelte:head
>

<!-- Действия карточки (общие для десктоп-меню и мобильного bottom-sheet).
     horizontal=true → подписи «Move left/right» для горизонтальной ленты на мобилках. -->
{#snippet cardActions(card: Card, i: number, horizontal: boolean)}
	<button
		onclick={(e) => {
			e.stopPropagation();
			moveCard(card.id, -1);
		}}
		disabled={i === 0}
		class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
	>
		{#if horizontal}<ArrowLeft size={15} /> Move left{:else}<ArrowUp size={15} /> Move up{/if}
	</button>
	<button
		onclick={(e) => {
			e.stopPropagation();
			moveCard(card.id, 1);
		}}
		disabled={i === cards.length - 1}
		class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
	>
		{#if horizontal}<ArrowRight size={15} /> Move right{:else}<ArrowDown size={15} /> Move down{/if}
	</button>
	<div class="my-1 h-px bg-white/5"></div>
	<button
		onclick={(e) => {
			e.stopPropagation();
			duplicateCard(card.id);
		}}
		class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
	>
		<Copy size={15} /> Duplicate
	</button>
	<button
		onclick={(e) => {
			e.stopPropagation();
			changeTypeCardId = card.id;
			openCardMenu = null;
		}}
		class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
	>
		<Repeat2 size={15} /> Change type
	</button>
	<button
		onclick={(e) => {
			e.stopPropagation();
			deleteCard(card.id);
		}}
		class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
	>
		<Trash2 size={15} /> Delete
	</button>
{/snippet}

{#if isLoading}
	<div class="mx-auto max-w-7xl space-y-4">
		<div class="h-12 w-1/2 animate-pulse rounded-full bg-white/5"></div>
		<div class="flex gap-6">
			<div class="h-96 w-72 animate-pulse rounded-3xl bg-white/5"></div>
			<div class="h-96 flex-1 animate-pulse rounded-3xl bg-white/5"></div>
		</div>
	</div>
{:else if !quiz}
	<div
		class="mx-auto max-w-2xl rounded-4xl border border-dashed border-white/10 bg-surface py-20 text-center text-slate-500"
	>
		<p class="text-lg font-bold">{loadError ?? 'Quiz not found'}</p>
		<button
			onclick={() => goto('/quizzes')}
			class="mt-4 text-sm font-bold text-primary hover:underline">Back to My Quizzes</button
		>
	</div>
{:else}
	<div class="mx-auto max-w-7xl">
		<!-- Верхняя панель -->
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<button
				onclick={() => goto('/quizzes')}
				class="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
			>
				<ArrowLeft size={16} /> My Quizzes
			</button>

			<div class="flex flex-wrap items-center gap-2">
				<!-- Save: зелёная при несохранённых правках, серая когда всё сохранено -->
				<div title={saveBlockedReason ?? (dirty ? 'Save draft' : 'All changes saved')}>
					<Button
						variant="secondary"
						onclick={handleSave}
						isLoading={isSaving}
						disabled={!!saveBlockedReason || isPublishing || !dirty}
						class={cn(
							'shadow-none',
							dirty && 'border-green-600 bg-green-600 text-white hover:bg-green-700'
						)}
					>
						<Save size={16} />
						{dirty ? 'Save' : 'Saved'}
					</Button>
				</div>

				<!-- Publish: неактивна (серая), пока есть ошибки валидации -->
				<div title={publishError ?? 'Publish — everything looks good'}>
					<Button
						variant="secondary"
						onclick={handlePublish}
						isLoading={isPublishing}
						disabled={isSaving || !!publishError}
						class={cn(
							'px-5',
							!publishError &&
								'border-primary bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover'
						)}
					>
						<UploadCloud size={16} /> Publish
					</Button>
				</div>

				<div class="relative">
					<button
						onclick={(e) => {
							e.stopPropagation();
							showMenu = !showMenu;
						}}
						aria-label="More"
						class="rounded-xl border border-white/5 bg-surface p-2.5 text-slate-400 transition-colors hover:text-white"
					>
						<MoreVertical size={18} />
					</button>
					{#if showMenu}
						<div
							class="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl"
						>
							{#if hasSnapshot}
								<!-- Видимость опубликованного квиза меняется только в каталоге -->
								<div
									class="px-3 py-2"
									title="Visibility affects the whole quiz — change it from My Quizzes"
								>
									<div class="flex items-center gap-3 text-sm text-slate-600">
										{#if visibility === 'PUBLIC'}<Globe size={15} /> Public{:else}<Lock size={15} /> Private{/if}
									</div>
									<p class="mt-0.5 text-[11px] leading-snug text-slate-600">
										Change visibility from My Quizzes
									</p>
								</div>
							{:else}
								<button
									onclick={(e) => {
										e.stopPropagation();
										toggleVisibility();
									}}
									class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
								>
									{#if visibility === 'PUBLIC'}<Lock size={15} /> Make private{:else}<Globe
											size={15}
										/> Make public{/if}
								</button>
							{/if}
							<button
								onclick={() => {
									showMenu = false;
									showDelete = true;
								}}
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
							>
								<Trash2 size={15} />
								{hasSnapshot ? 'Delete draft' : 'Delete quiz'}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Заголовок и описание (без рамок) -->
		<div class="mb-6 border-b border-white/5 pb-6">
			<div class="mb-4 flex items-center gap-2">
				<span
					class={cn(
						'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
						visibility === 'PUBLIC'
							? 'border-sky-400/20 bg-sky-500/10 text-sky-300'
							: 'border-white/10 bg-white/5 text-slate-400'
					)}
				>
					{#if visibility === 'PUBLIC'}<Globe size={11} /> Public{:else}<Lock size={11} /> Private{/if}
				</span>
				{#if hasSnapshot}
					<span
						class="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-green-400 uppercase"
						>Published</span
					>
				{/if}
			</div>
			<div class="group relative">
				<input
					bind:value={title}
					maxlength={50}
					placeholder="Untitled quiz"
					class="block w-full bg-transparent text-4xl font-bold tracking-tight text-white placeholder:text-slate-700 focus:outline-none"
				/>
				<span
					class="pointer-events-none absolute right-0 bottom-0.5 text-[10px] tabular-nums transition-colors
						{title.length >= 50
						? 'text-red-400'
						: title.length >= 45
							? 'text-amber-500'
							: 'text-slate-700 opacity-0 group-focus-within:opacity-100'}"
				>
					{title.length}/50
				</span>
			</div>
			<div class="group relative mt-3">
				<textarea
					bind:value={description}
					maxlength={500}
					rows="2"
					placeholder="Add a description…"
					class="block w-full resize-none bg-transparent text-base leading-relaxed text-slate-400 placeholder:text-slate-600 focus:outline-none"
				></textarea>
				<span
					class="pointer-events-none absolute right-0 bottom-0.5 text-[10px] tabular-nums transition-colors
						{description.length >= 500
						? 'text-red-400'
						: description.length >= 450
							? 'text-amber-500'
							: 'text-slate-700 opacity-0 group-focus-within:opacity-100'}"
				>
					{description.length}/500
				</span>
			</div>
		</div>

		<div class="flex flex-col gap-6 lg:flex-row">
			<!-- Слайд-панель -->
			<aside class="lg:w-72 lg:shrink-0">
				<div class="mb-3 px-1">
					<span class="text-[11px] font-bold tracking-widest text-slate-500 uppercase"
						>Cards · {cards.length}/{MAX_CARDS}</span
					>
				</div>

				<div
					use:dragScrollGuard
					class="flex gap-3 overflow-x-auto px-1 py-3 lg:flex-col lg:overflow-visible lg:p-0"
				>
					{#each cards as card, i (card.id)}
						{@const valid = isCardValid(card)}
						{@const Icon = iconFor(card.type)}
						<div
							role="button"
							tabindex="0"
							draggable="true"
							data-card-index={i}
							animate:flip={{ duration: 260, easing: cubicOut }}
							ondragstart={() => (dragIndex = i)}
							ondragover={(e) => {
								e.preventDefault();
								handleDragOver(i);
							}}
							ondrop={(e) => {
								e.preventDefault();
								endDrag();
							}}
							ondragend={endDrag}
							onpointerdown={(e) => cardPointerDown(e, card, i)}
							onpointermove={cardPointerMove}
							onpointerup={cardPointerUp}
							onpointercancel={cardPointerUp}
							onclick={() => (selectedId = card.id)}
							onkeydown={(e) => selectCardKey(e, card.id)}
							class={cn(
								'group relative flex w-44 shrink-0 cursor-grab touch-pan-x items-center gap-2 rounded-2xl border bg-surface p-2.5 text-left transition-all select-none active:cursor-grabbing sm:w-60 sm:gap-3 sm:p-3 lg:w-full',
								selectedId === card.id
									? 'border-primary ring-2 ring-primary/40'
									: 'border-white/5 hover:border-white/15',
								dragIndex === i ? 'opacity-50 ring-2 ring-primary/30' : '',
								touchDragActive && dragIndex === i
									? 'z-20 scale-[1.03] shadow-2xl shadow-primary/30'
									: ''
							)}
						>
							<GripVertical
								size={15}
								class="hidden shrink-0 text-slate-600 group-hover:text-slate-400 lg:block"
							/>
							<span
								class={cn(
									'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[11px] font-bold',
									valid ? 'text-green-400' : 'text-red-400'
								)}>{i + 1}</span
							>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-white">
									{card.questionText || 'Untitled question'}
								</p>
								<span class="flex items-center gap-1 text-[10px] text-slate-500"
									><Icon size={11} />
									{card.type === 'SINGLE_CHOICE'
										? 'Single'
										: card.type === 'MULTIPLE_CHOICE'
											? 'Multiple'
											: 'Text'}</span
								>
							</div>

							<!-- Меню действий карточки -->
							<div class="relative shrink-0">
								<button
									onpointerdown={(e) => e.stopPropagation()}
									onclick={(e) => {
										e.stopPropagation();
										openCardMenu = openCardMenu === card.id ? null : card.id;
									}}
									aria-label="Card actions"
									class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
								>
									<MoreHorizontal size={16} />
								</button>
								<!-- Десктоп: выпадающее меню (контейнер на lg overflow-visible, не обрезается) -->
								{#if openCardMenu === card.id}
									<div
										class="absolute right-0 z-40 mt-1 hidden w-44 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl lg:block"
									>
										{@render cardActions(card, i, false)}
									</div>
								{/if}
							</div>
						</div>
					{/each}

					<button
						onclick={(e) => {
							e.stopPropagation();
							showAddMenu = true;
						}}
						class="flex w-44 shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-primary/30 hover:text-primary sm:w-60 lg:w-full"
					>
						<Plus size={15} /> Add card
					</button>
				</div>
			</aside>

			<!-- Редактор выбранной карточки -->
			<section class="min-w-0 flex-1">
				{#if selectedCard}
					{@const SelIcon = iconFor(selectedCard.type)}
					<div class="rounded-4xl border border-white/5 bg-surface p-4 shadow-2xl sm:p-8">
						<div class="mb-5 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="text-sm font-bold tracking-widest text-slate-500 uppercase"
									>Card {selectedIndex + 1}</span
								>
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-primary uppercase"
								>
									<SelIcon size={12} />
									{labelFor(selectedCard.type)}
								</span>
							</div>
							<div class="flex items-center gap-1">
								<button
									onclick={() => duplicateCard(selectedCard.id)}
									title="Duplicate card"
									aria-label="Duplicate card"
									class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
								>
									<Copy size={16} />
								</button>
								<button
									onclick={() => deleteCard(selectedCard.id)}
									title="Delete card"
									aria-label="Delete card"
									class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
						{#key selectedCard.id}
							<CardEditor card={selectedCard} />
						{/key}
					</div>
				{:else}
					<div
						class="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/10 bg-surface/50 py-24 text-center"
					>
						<div
							class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-slate-600"
						>
							<LayoutGrid size={28} />
						</div>
						<h2 class="text-lg font-bold text-white">No card selected</h2>
						<p class="mt-1 max-w-xs text-sm text-slate-500">
							Add a card or pick one from the list to start editing.
						</p>
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}

<!-- Мобильный bottom-sheet действий карточки (поверх всего, не обрезается контейнером) -->
{#if openCardMenu}
	{@const menuIndex = cards.findIndex((c) => c.id === openCardMenu)}
	{@const menuCard = cards[menuIndex]}
	{#if menuCard}
		<div
			class="fixed inset-0 z-1000 bg-black/50 lg:hidden"
			role="presentation"
			onclick={() => (openCardMenu = null)}
			onkeydown={(e) => {
				if (e.key === 'Escape') openCardMenu = null;
			}}
		>
			<div
				class="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-surface p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
				role="presentation"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="mx-auto my-2 h-1 w-10 rounded-full bg-white/15"></div>
				<p
					class="truncate px-3 pb-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase"
				>
					Card {menuIndex + 1} · {menuCard.questionText || 'Untitled'}
				</p>
				{@render cardActions(menuCard, menuIndex, true)}
			</div>
		</div>
	{/if}
{/if}

<!-- Модалка выбора типа новой карточки -->
{#if showAddMenu}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) showAddMenu = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') showAddMenu = false;
		}}
	>
		<div
			class="w-full max-w-md rounded-[2rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-8"
		>
			<h3 class="text-xl font-bold text-white">Add a card</h3>
			<p class="mt-2 text-sm leading-relaxed text-slate-400">Choose the type of question to add.</p>
			<div class="mt-6 flex flex-col gap-2">
				{#each cardTypes as t}
					<button
						onclick={(e) => {
							e.stopPropagation();
							addCard(t.type);
						}}
						class="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm font-bold text-slate-200 transition-all hover:border-primary/40 hover:text-primary"
					>
						<t.icon size={18} />
						{t.label}
					</button>
				{/each}
			</div>
			<button
				onclick={() => (showAddMenu = false)}
				class="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold tracking-widest text-slate-200 uppercase transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<!-- Модалка смены типа карточки -->
{#if changeTypeCard}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) changeTypeCardId = null;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') changeTypeCardId = null;
		}}
	>
		<div
			class="w-full max-w-md rounded-[2rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-8"
		>
			<h3 class="text-xl font-bold text-white">Change card type</h3>
			<p class="mt-2 text-sm leading-relaxed text-amber-400/90">
				This will reset the card — the question and all answers will be cleared.
			</p>
			<div class="mt-6 flex flex-col gap-2">
				{#each cardTypes as t}
					{@const current = changeTypeCard.type === t.type}
					<button
						onclick={() => applyChangeType(t.type)}
						disabled={current}
						class={cn(
							'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all',
							current
								? 'cursor-not-allowed border-white/10 bg-slate-950/40 text-slate-600'
								: 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-primary/40 hover:text-primary'
						)}
					>
						<t.icon size={18} />
						{t.label}
						{#if current}<span class="ml-auto text-[10px] tracking-widest text-slate-600 uppercase"
								>current</span
							>{/if}
					</button>
				{/each}
			</div>
			<button
				onclick={() => (changeTypeCardId = null)}
				class="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold tracking-widest text-slate-200 uppercase transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<ConfirmDialog
	isOpen={showDelete}
	title={hasSnapshot ? 'Delete draft' : 'Delete quiz'}
	message={hasSnapshot
		? 'Your draft edits will be removed. The published version will stay.'
		: 'This will permanently delete the quiz. This action cannot be undone.'}
	confirmLabel={hasSnapshot ? 'Delete draft' : 'Delete'}
	destructive={true}
	isLoading={isDeleting}
	onConfirm={handleDelete}
	onClose={() => (showDelete = false)}
/>
