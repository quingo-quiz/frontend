<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Plus, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import QuizCard from '$lib/components/quiz/QuizCard.svelte';
	import NewQuizModal from '$lib/components/quiz/NewQuizModal.svelte';
	import QuizPreviewModal from '$lib/components/quiz/QuizPreviewModal.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { cn } from '$lib/utils/ui';
	import { isDraft } from '$lib/utils/quiz';
	import { quizService } from '$lib/api/quiz';
	import type { QuizSummary, QuizStatus, CreateQuizRequest } from '$lib/types/quiz';

	let quizzes = $state<QuizSummary[]>([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let showCreateModal = $state(false);
	let isCreating = $state(false);
	let previewQuiz = $state<QuizSummary | null>(null);

	let deleteTarget = $state<QuizSummary | null>(null);
	let deleteMode = $state<'draft' | 'quiz'>('quiz');
	let isDeleting = $state(false);

	// Пагинация
	let currentPage = $state(0);
	let pageSize = $state(12);
	const pageSizeOptions = [6, 12, 24];

	function openQuiz(quiz: QuizSummary) {
		if (isDraft(quiz.status)) {
			goto(`/quizzes/${quiz.id}/edit`);
		} else {
			previewQuiz = quiz;
		}
	}

	function handleEdit(quiz: QuizSummary) {
		goto(`/quizzes/${quiz.id}/edit`);
	}

	function handleStart(_quiz: QuizSummary) {
		toasts.show('Live game is coming soon', 'info');
	}

	async function handleToggleVisibility(quiz: QuizSummary) {
		const next = quiz.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		try {
			await quizService.update(quiz.id, { visibility: next });
			toasts.show(next === 'PUBLIC' ? 'Quiz is now public' : 'Quiz is now private', 'success');
			quizzes = await quizService.list();
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to change visibility', 'error');
		}
	}

	function handleDelete(quiz: QuizSummary) {
		const hasPublishedTwin = quizzes.some((q) => q.id === quiz.id && q.status === 'PUBLISHED');
		deleteMode = isDraft(quiz.status) && hasPublishedTwin ? 'draft' : 'quiz';
		deleteTarget = quiz;
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		isDeleting = true;
		try {
			if (deleteMode === 'draft') await quizService.discardDraft(target.id);
			else await quizService.remove(target.id);
			toasts.show(deleteMode === 'draft' ? 'Draft deleted' : 'Quiz deleted', 'success');
			deleteTarget = null;
			quizzes = await quizService.list();
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to delete', 'error');
		} finally {
			isDeleting = false;
		}
	}

	type Filter = 'ALL' | 'DRAFTS' | 'PUBLISHED';
	let filter = $state<Filter>('ALL');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'ALL', label: 'All' },
		{ id: 'DRAFTS', label: 'Drafts' },
		{ id: 'PUBLISHED', label: 'Published' }
	];

	function matchesFilter(status: QuizStatus, f: Filter): boolean {
		if (f === 'ALL') return true;
		if (f === 'DRAFTS') return isDraft(status);
		return !isDraft(status);
	}

	let filteredQuizzes = $derived(quizzes.filter((q) => matchesFilter(q.status, filter)));
	let totalPages = $derived(Math.max(1, Math.ceil(filteredQuizzes.length / pageSize)));
	let visibleQuizzes = $derived(
		filteredQuizzes.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
	);
	let fromItem = $derived(filteredQuizzes.length === 0 ? 0 : currentPage * pageSize + 1);
	let toItem = $derived(Math.min((currentPage + 1) * pageSize, filteredQuizzes.length));

	// При смене фильтра или размера страницы — сбрасываем на первую страницу
	$effect(() => {
		filter;
		pageSize;
		currentPage = 0;
	});

	function paginationPages(current: number, total: number): (number | '…')[] {
		if (total <= 1) return [];
		if (total <= 7) return Array.from({ length: total }, (_, i) => i);
		const pages: (number | '…')[] = [0];
		const lo = Math.max(1, current - 1);
		const hi = Math.min(total - 2, current + 1);
		if (lo > 1) pages.push('…');
		for (let i = lo; i <= hi; i++) pages.push(i);
		if (hi < total - 2) pages.push('…');
		pages.push(total - 1);
		return pages;
	}

	let pages = $derived(paginationPages(currentPage, totalPages));

	onMount(async () => {
		try {
			quizzes = await quizService.list();
		} catch (e: any) {
			loadError = e?.message || 'Failed to load quizzes';
			toasts.show(loadError ?? 'Failed to load quizzes', 'error');
		} finally {
			isLoading = false;
		}
	});

	async function handleCreate(data: CreateQuizRequest) {
		isCreating = true;
		try {
			const quiz = await quizService.create(data);
			toasts.show('Quiz created', 'success');
			showCreateModal = false;
			goto(`/quizzes/${quiz.id}/edit`);
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to create quiz', 'error');
		} finally {
			isCreating = false;
		}
	}
</script>

<svelte:head><title>My Quizzes · Quingo</title></svelte:head>

<div class="mx-auto max-w-7xl">
	<!-- Шапка раздела -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-3xl font-bold text-white italic">My Quizzes</h1>
		<Button onclick={() => (showCreateModal = true)} class="shrink-0">
			<Plus size={18} /> Create Quiz
		</Button>
	</div>

	<!-- Фильтр + настройки отображения -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div class="inline-flex rounded-xl border border-white/5 bg-slate-950/60 p-1">
			{#each filters as f}
				<button
					onclick={() => (filter = f.id)}
					class={cn(
						'rounded-lg px-4 py-2 text-xs font-bold transition-all',
						filter === f.id
							? 'bg-primary text-white shadow-md shadow-primary/20'
							: 'text-slate-500 hover:text-slate-300'
					)}
				>
					{f.label}
				</button>
			{/each}
		</div>

		<!-- Выбор количества на странице -->
		{#if !isLoading && filteredQuizzes.length > 0}
			<div class="flex items-center gap-2 text-xs text-slate-500">
				<span>Per page:</span>
				<div class="inline-flex rounded-lg border border-white/5 bg-slate-950/60 p-0.5">
					{#each pageSizeOptions as size}
						<button
							onclick={() => (pageSize = size)}
							class={cn(
								'rounded-md px-2.5 py-1 text-xs font-bold transition-all',
								pageSize === size
									? 'bg-white/10 text-white'
									: 'text-slate-500 hover:text-slate-300'
							)}
						>
							{size}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	{#if isLoading}
		<!-- Скелетоны -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each Array(6) as _}
				<div class="overflow-hidden rounded-3xl border border-white/5 bg-surface">
					<div class="aspect-video animate-pulse bg-white/5"></div>
					<div class="space-y-3 p-5">
						<div class="h-5 w-2/3 animate-pulse rounded-full bg-white/5"></div>
						<div class="h-3 w-full animate-pulse rounded-full bg-white/5"></div>
						<div class="h-3 w-1/2 animate-pulse rounded-full bg-white/5"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredQuizzes.length === 0}
		<!-- Пустое состояние -->
		<div
			class="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/10 bg-surface/50 py-20 text-center"
		>
			<div
				class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-slate-600"
			>
				<LayoutGrid size={28} />
			</div>
			<h2 class="text-lg font-bold text-white">
				{filter === 'ALL' ? 'No quizzes yet' : 'Nothing here'}
			</h2>
			<p class="mt-1 max-w-xs text-sm text-slate-500">
				{filter === 'ALL'
					? 'Create your first quiz to get started.'
					: 'Try a different filter or create a new quiz.'}
			</p>
			<Button onclick={() => (showCreateModal = true)} class="mt-6">
				<Plus size={18} /> Create Quiz
			</Button>
		</div>
	{:else}
		<!-- Счётчик и сетка -->
		<p class="mb-5 text-xs text-slate-600">
			Showing <span class="font-semibold text-slate-400">{fromItem}–{toItem}</span> of
			<span class="font-semibold text-slate-400">{filteredQuizzes.length}</span>
			{filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'}
			{#if totalPages > 1}&nbsp;· page <span class="font-semibold text-slate-400">{currentPage + 1}</span> of <span class="font-semibold text-slate-400">{totalPages}</span>{/if}
		</p>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each visibleQuizzes as quiz (quiz.id + '-' + quiz.status)}
				<QuizCard
					{quiz}
					onSelect={openQuiz}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onStart={handleStart}
					onToggleVisibility={handleToggleVisibility}
				/>
			{/each}
		</div>

		<!-- Пагинация -->
		{#if totalPages > 1}
			<div class="mt-10 flex items-center justify-center gap-1.5">
				<button
					onclick={() => (currentPage -= 1)}
					disabled={currentPage === 0}
					aria-label="Previous page"
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronLeft size={16} />
				</button>

				{#each pages as p}
					{#if p === '…'}
						<span class="flex h-9 w-9 items-center justify-center text-sm text-slate-600">…</span>
					{:else}
						<button
							onclick={() => (currentPage = p)}
							aria-label="Page {p + 1}"
							aria-current={p === currentPage ? 'page' : undefined}
							class="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors
								{p === currentPage
								? 'border-primary/30 bg-primary/15 text-primary'
								: 'border-white/10 bg-surface text-slate-400 hover:border-white/20 hover:text-white'}"
						>
							{p + 1}
						</button>
					{/if}
				{/each}

				<button
					onclick={() => (currentPage += 1)}
					disabled={currentPage >= totalPages - 1}
					aria-label="Next page"
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronRight size={16} />
				</button>
			</div>
		{/if}
	{/if}
</div>

<NewQuizModal
	isOpen={showCreateModal}
	isSubmitting={isCreating}
	onClose={() => (showCreateModal = false)}
	onCreate={handleCreate}
/>

<QuizPreviewModal
	quiz={previewQuiz}
	canEdit={true}
	onClose={() => (previewQuiz = null)}
	onStart={() => toasts.show('Live game is coming soon', 'info')}
	onEdit={(q) => goto(`/quizzes/${q.id}/edit`)}
/>

<ConfirmDialog
	isOpen={!!deleteTarget}
	title={deleteMode === 'draft' ? 'Delete draft' : 'Delete quiz'}
	message={deleteMode === 'draft'
		? 'Your draft edits will be removed. The published version will stay.'
		: 'This will permanently delete the quiz. This action cannot be undone.'}
	confirmLabel={deleteMode === 'draft' ? 'Delete draft' : 'Delete'}
	destructive={true}
	isLoading={isDeleting}
	onConfirm={confirmDelete}
	onClose={() => (deleteTarget = null)}
/>
