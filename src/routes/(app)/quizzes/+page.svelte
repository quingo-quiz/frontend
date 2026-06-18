<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Plus, LayoutGrid } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import QuizCard from '$lib/components/quiz/QuizCard.svelte';
	import NewQuizModal from '$lib/components/quiz/NewQuizModal.svelte';
	import QuizPreviewModal from '$lib/components/quiz/QuizPreviewModal.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { cn } from '$lib/utils/ui';
	import { isDraft } from '$lib/utils/quiz';
	import type { QuizSummary, QuizStatus, CreateQuizRequest } from '$lib/types/quiz';
	// TODO: заменить mock на quizService.list(), когда main-service будет готов
	import { mockQuizzes } from '$lib/mocks/quizzes';

	let quizzes = $state<QuizSummary[]>([]);
	let isLoading = $state(true);
	let showCreateModal = $state(false);
	let isCreating = $state(false);
	let previewQuiz = $state<QuizSummary | null>(null);

	// Черновик открываем сразу в редакторе, опубликованный — через окно предпросмотра
	function openQuiz(quiz: QuizSummary) {
		if (isDraft(quiz.status)) {
			goto(`/quizzes/${quiz.id}/edit`);
		} else {
			previewQuiz = quiz;
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

	let visibleQuizzes = $derived(quizzes.filter((q) => matchesFilter(q.status, filter)));

	onMount(async () => {
		// Имитация загрузки (mock). Реальный вызов: quizzes = await quizService.list();
		await new Promise((r) => setTimeout(r, 400));
		quizzes = mockQuizzes;
		isLoading = false;
	});

	async function handleCreate(data: CreateQuizRequest) {
		isCreating = true;
		try {
			// Реальный флоу (когда main-service готов):
			//   const quiz = await quizService.create(data);
			//   goto(`/quizzes/${quiz.id}/edit`);
			// Намеренно НЕ добавляем квиз в список вручную — список перечитывается с бэкенда.
			await new Promise((r) => setTimeout(r, 400));
			toasts.show('Quiz created', 'success');
			showCreateModal = false;
		} catch (e: any) {
			toasts.show(e.message || 'Failed to create quiz', 'error');
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="mx-auto max-w-7xl">
	<!-- Шапка раздела -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold italic text-white">My Quizzes</h1>
			<p class="mt-1 text-sm text-slate-500">Create, edit and publish your quizzes.</p>
		</div>
		<Button onclick={() => (showCreateModal = true)} class="shrink-0">
			<Plus size={18} /> Create Quiz
		</Button>
	</div>

	<!-- Фильтр по статусу -->
	<div class="mb-6 inline-flex rounded-xl border border-white/5 bg-slate-950/60 p-1">
		{#each filters as f}
			<button
				onclick={() => (filter = f.id)}
				class={cn(
					'rounded-lg px-4 py-2 text-xs font-bold transition-all',
					filter === f.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
				)}
			>
				{f.label}
			</button>
		{/each}
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
	{:else if visibleQuizzes.length === 0}
		<!-- Пустое состояние -->
		<div class="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/10 bg-surface/50 py-20 text-center">
			<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-slate-600">
				<LayoutGrid size={28} />
			</div>
			<h2 class="text-lg font-bold text-white">
				{filter === 'ALL' ? 'No quizzes yet' : 'Nothing here'}
			</h2>
			<p class="mt-1 max-w-xs text-sm text-slate-500">
				{filter === 'ALL' ? 'Create your first quiz to get started.' : 'Try a different filter or create a new quiz.'}
			</p>
			<Button onclick={() => (showCreateModal = true)} class="mt-6">
				<Plus size={18} /> Create Quiz
			</Button>
		</div>
	{:else}
		<!-- Сетка карточек -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each visibleQuizzes as quiz (quiz.id)}
				<QuizCard {quiz} onSelect={openQuiz} />
			{/each}
		</div>
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
