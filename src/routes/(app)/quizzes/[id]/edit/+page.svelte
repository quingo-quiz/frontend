<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft, Plus, Globe, Lock, GripVertical, Trash2, Copy, Repeat2,
		MoreVertical, MoreHorizontal, Save, UploadCloud, ListChecks, CheckSquare, Type as TypeIcon, LayoutGrid
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import { isCardValid, createCard, changeCardType, newId, MAX_CARDS } from '$lib/utils/quiz';
	import { toasts } from '$lib/runes/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import CardEditor from '$lib/components/quiz/editor/CardEditor.svelte';
	import type { Quiz, Card, CardType, QuizVisibility } from '$lib/types/quiz';
	// TODO: заменить getMockQuiz на quizService.get(id); Save/Publish — на quizService.*
	import { getMockQuiz } from '$lib/mocks/quizzes';

	let id = $derived(page.params.id ?? '');

	let isLoading = $state(true);
	let loaded = $state(false);
	let quiz = $state<Quiz | null>(null);

	// Рабочее состояние черновика (локально в localStorage; на бэкенд — по кнопке Save)
	let title = $state('');
	let description = $state('');
	let visibility = $state<QuizVisibility>('PRIVATE');
	let cards = $state<Card[]>([]);
	let selectedId = $state<string | null>(null);
	let isSaving = $state(false);

	let showMenu = $state(false);
	let showAddMenu = $state(false);
	let openCardMenu = $state<string | null>(null);
	let changeTypeCardId = $state<string | null>(null);
	let showDiscard = $state(false);
	let showDelete = $state(false);

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
	let changeTypeCard = $derived(cards.find((c) => c.id === changeTypeCardId) ?? null);

	const storageKey = (qid: string) => `quingo:draft:${qid}`;

	onMount(async () => {
		await new Promise((r) => setTimeout(r, 250));
		const mock = getMockQuiz(id);
		const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey(id)) : null;

		if (stored) {
			try {
				const data = JSON.parse(stored);
				title = data.title ?? '';
				description = data.description ?? '';
				visibility = data.visibility ?? 'PRIVATE';
				cards = (data.cards ?? []).map((c: Card) => ({ ...c }));
				quiz = mock ?? { id, visibility, status: 'UNPUBLISHED' };
			} catch {
				quiz = mock ?? null;
			}
		} else if (mock) {
			quiz = mock;
			const content = mock.draft ?? mock.snapshot;
			title = content?.title ?? '';
			description = content?.description ?? '';
			visibility = mock.visibility;
			cards = (content?.cards ?? []).map((c) => ({ ...c }));
		} else {
			quiz = null;
		}

		selectedId = cards[0]?.id ?? null;
		isLoading = false;
		loaded = true;
	});

	// Автосохранение в localStorage
	$effect(() => {
		if (!loaded || !id) return;
		const snapshot = JSON.stringify({ title, description, visibility, cards });
		try {
			localStorage.setItem(storageKey(id), snapshot);
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
			options: src.options?.map((o) => ({ ...o, id: newId() })),
			acceptedTexts: src.acceptedTexts ? [...src.acceptedTexts] : undefined
		};
		const idx = cards.findIndex((c) => c.id === cardId);
		const updated = [...cards];
		updated.splice(idx + 1, 0, copy);
		cards = updated.map((c, i) => ({ ...c, position: i }));
		selectedId = copy.id;
		openCardMenu = null;
	}

	function applyChangeType(t: CardType) {
		const cid = changeTypeCardId;
		changeTypeCardId = null;
		if (!cid) return;
		cards = cards.map((c) => (c.id === cid ? changeCardType(c, t) : c));
		selectedId = cid;
	}

	// --- Drag & drop ---
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function handleDrop(toIndex: number) {
		if (dragIndex === null || dragIndex === toIndex) {
			dragIndex = dragOverIndex = null;
			return;
		}
		const updated = [...cards];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(toIndex, 0, moved);
		cards = updated.map((c, i) => ({ ...c, position: i }));
		dragIndex = dragOverIndex = null;
		// TODO: quizService.reorderCards(id, cards.map((c) => c.id))
	}

	// --- Действия ---
	function handleSave() {
		if (saveBlockedReason) {
			toasts.show(saveBlockedReason, 'error');
			return;
		}
		isSaving = true;
		// TODO: отправка черновика на бэкенд
		setTimeout(() => {
			isSaving = false;
			toasts.show('Draft saved', 'success');
		}, 500);
	}

	function handlePublish() {
		if (publishError) {
			const badIdx = cards.findIndex((c) => !isCardValid(c));
			if (badIdx >= 0) selectedId = cards[badIdx].id; // переводим к проблемной карточке
			toasts.show(publishError, 'error');
			return;
		}
		// TODO: await quizService.publish(id)
		toasts.show('Quiz published', 'success');
	}

	function handleDiscard() {
		showDiscard = false;
		try { localStorage.removeItem(storageKey(id)); } catch { /* noop */ }
		toasts.show('Changes discarded', 'info');
		goto('/quizzes');
	}

	function handleDelete() {
		showDelete = false;
		try { localStorage.removeItem(storageKey(id)); } catch { /* noop */ }
		toasts.show('Quiz deleted', 'info');
		goto('/quizzes');
	}

	function selectCardKey(e: KeyboardEvent, cardId: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectedId = cardId;
		}
	}
</script>

<svelte:window onclick={() => { showAddMenu = false; showMenu = false; openCardMenu = null; }} />

{#if isLoading}
	<div class="mx-auto max-w-7xl space-y-4">
		<div class="h-12 w-1/2 animate-pulse rounded-full bg-white/5"></div>
		<div class="flex gap-6">
			<div class="h-96 w-72 animate-pulse rounded-3xl bg-white/5"></div>
			<div class="h-96 flex-1 animate-pulse rounded-3xl bg-white/5"></div>
		</div>
	</div>
{:else if !quiz}
	<div class="mx-auto max-w-2xl rounded-4xl border border-dashed border-white/10 bg-surface py-20 text-center text-slate-500">
		<p class="text-lg font-bold">Quiz not found</p>
		<button onclick={() => goto('/quizzes')} class="mt-4 text-sm font-bold text-primary hover:underline">Back to My Quizzes</button>
	</div>
{:else}
	<div class="mx-auto max-w-7xl">
		<!-- Верхняя панель -->
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<button onclick={() => goto('/quizzes')} class="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white">
				<ArrowLeft size={16} /> My Quizzes
			</button>

			<div class="flex flex-wrap items-center gap-2">
				<div class="flex rounded-xl border border-white/5 bg-slate-950/60 p-1">
					<button
						onclick={() => (visibility = 'PRIVATE')}
						class={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
							visibility === 'PRIVATE' ? 'bg-slate-500/20 text-slate-100' : 'text-slate-500 hover:text-slate-300')}
					>
						<Lock size={13} /> Private
					</button>
					<button
						onclick={() => (visibility = 'PUBLIC')}
						class={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
							visibility === 'PUBLIC' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300')}
					>
						<Globe size={13} /> Public
					</button>
				</div>

				<div title={saveBlockedReason ?? 'Save draft'}>
					<Button variant="secondary" onclick={handleSave} isLoading={isSaving} disabled={!!saveBlockedReason}>
						<Save size={16} /> Save
					</Button>
				</div>

				<div title={publishError ?? 'Publish — everything looks good'}>
					<Button onclick={handlePublish} class={cn('px-5', publishError && 'bg-red-600 shadow-red-600/20 hover:bg-red-700')}>
						<UploadCloud size={16} /> Publish
					</Button>
				</div>

				<div class="relative">
					<button onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }} aria-label="More" class="rounded-xl border border-white/5 bg-surface p-2.5 text-slate-400 transition-colors hover:text-white">
						<MoreVertical size={18} />
					</button>
					{#if showMenu}
						<div class="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl">
							{#if quiz.status === 'PUBLISHED_WITH_DRAFT'}
								<button onclick={() => { showMenu = false; showDiscard = true; }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
									Discard changes
								</button>
							{/if}
							<button onclick={() => { showMenu = false; showDelete = true; }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
								<Trash2 size={15} /> Delete quiz
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Заголовок и описание (без рамок) -->
		<div class="mb-6 border-b border-white/5 pb-5">
			<input
				bind:value={title}
				placeholder="Untitled quiz"
				class="w-full bg-transparent text-3xl font-bold tracking-tight text-white placeholder:text-slate-700 focus:outline-none"
			/>
			<textarea
				bind:value={description}
				rows="1"
				placeholder="Add a description…"
				class="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-slate-400 placeholder:text-slate-600 focus:outline-none"
			></textarea>
		</div>

		<div class="flex flex-col gap-6 lg:flex-row">
			<!-- Слайд-панель -->
			<aside class="lg:w-72 lg:shrink-0">
				<div class="mb-3 px-1">
					<span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cards · {cards.length}/{MAX_CARDS}</span>
				</div>

				<div class="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
					{#each cards as card, i (card.id)}
						{@const valid = isCardValid(card)}
						{@const Icon = iconFor(card.type)}
						<div
							role="button"
							tabindex="0"
							draggable="true"
							ondragstart={() => (dragIndex = i)}
							ondragover={(e) => { e.preventDefault(); dragOverIndex = i; }}
							ondrop={() => handleDrop(i)}
							ondragend={() => { dragIndex = dragOverIndex = null; }}
							onclick={() => (selectedId = card.id)}
							onkeydown={(e) => selectCardKey(e, card.id)}
							class={cn(
								'group relative flex w-60 shrink-0 cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-all lg:w-full',
								selectedId === card.id ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-surface hover:border-white/15',
								dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-primary/40' : '',
								dragIndex === i ? 'opacity-40' : ''
							)}
						>
							<GripVertical size={15} class="shrink-0 cursor-grab text-slate-600 group-hover:text-slate-400" />
							<span class={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
								valid ? 'bg-slate-950 text-slate-400' : 'bg-red-500/15 text-red-400')}>{i + 1}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-white">{card.questionText || 'Untitled question'}</p>
								<span class="flex items-center gap-1 text-[10px] text-slate-500"><Icon size={11} /> {card.type === 'SINGLE_CHOICE' ? 'Single' : card.type === 'MULTIPLE_CHOICE' ? 'Multiple' : 'Text'}</span>
							</div>

							<!-- Меню действий карточки -->
							<div class="relative shrink-0">
								<button
									onclick={(e) => { e.stopPropagation(); openCardMenu = openCardMenu === card.id ? null : card.id; }}
									aria-label="Card actions"
									class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
								>
									<MoreHorizontal size={16} />
								</button>
								{#if openCardMenu === card.id}
									<div class="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl">
										<button onclick={(e) => { e.stopPropagation(); duplicateCard(card.id); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
											<Copy size={15} /> Duplicate
										</button>
										<button onclick={(e) => { e.stopPropagation(); changeTypeCardId = card.id; openCardMenu = null; }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
											<Repeat2 size={15} /> Change type
										</button>
										<button onclick={(e) => { e.stopPropagation(); deleteCard(card.id); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
											<Trash2 size={15} /> Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}

					<div class="relative shrink-0">
						<button
							onclick={(e) => { e.stopPropagation(); showAddMenu = !showAddMenu; }}
							class="flex w-60 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-primary/30 hover:text-primary lg:w-full"
						>
							<Plus size={15} /> Add card
						</button>
						{#if showAddMenu}
							<div class="absolute left-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl">
								{#each cardTypes as t}
									<button onclick={(e) => { e.stopPropagation(); addCard(t.type); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
										<t.icon size={16} /> {t.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</aside>

			<!-- Редактор выбранной карточки -->
			<section class="min-w-0 flex-1">
				{#if selectedCard}
					<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-8">
						<div class="mb-5 flex items-center justify-between">
							<span class="text-sm font-bold uppercase tracking-widest text-slate-500">Card {selectedIndex + 1}</span>
							<div class="flex items-center gap-1">
								<button onclick={() => duplicateCard(selectedCard.id)} title="Duplicate card" aria-label="Duplicate card" class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white">
									<Copy size={16} />
								</button>
								<button onclick={() => deleteCard(selectedCard.id)} title="Delete card" aria-label="Delete card" class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400">
									<Trash2 size={16} />
								</button>
							</div>
						</div>
						{#key selectedCard.id}
							<CardEditor card={selectedCard} />
						{/key}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/10 bg-surface/50 py-24 text-center">
						<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-slate-600">
							<LayoutGrid size={28} />
						</div>
						<h2 class="text-lg font-bold text-white">No card selected</h2>
						<p class="mt-1 max-w-xs text-sm text-slate-500">Add a card or pick one from the list to start editing.</p>
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}

<!-- Модалка смены типа карточки -->
{#if changeTypeCard}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) changeTypeCardId = null; }}
		onkeydown={(e) => { if (e.key === 'Escape') changeTypeCardId = null; }}
	>
		<div class="w-full max-w-md rounded-[2rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-8">
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
						class={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all',
							current ? 'cursor-not-allowed border-white/10 bg-slate-950/40 text-slate-600' : 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-primary/40 hover:text-primary')}
					>
						<t.icon size={18} /> {t.label}
						{#if current}<span class="ml-auto text-[10px] uppercase tracking-widest text-slate-600">current</span>{/if}
					</button>
				{/each}
			</div>
			<button onclick={() => (changeTypeCardId = null)} class="mt-5 w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-white">
				Cancel
			</button>
		</div>
	</div>
{/if}

<ConfirmDialog
	isOpen={showDiscard}
	title="Discard changes"
	message="Your draft edits will be lost and the published version will remain. Continue?"
	confirmLabel="Discard"
	destructive={true}
	onConfirm={handleDiscard}
	onClose={() => (showDiscard = false)}
/>

<ConfirmDialog
	isOpen={showDelete}
	title="Delete quiz"
	message="This will permanently delete the quiz. This action cannot be undone."
	confirmLabel="Delete"
	destructive={true}
	onConfirm={handleDelete}
	onClose={() => (showDelete = false)}
/>
