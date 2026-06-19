<script lang="ts">
	import { Globe, Lock, ImageIcon, Layers, MoreVertical, Pencil, Trash2, Play } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import { isDraft } from '$lib/utils/quiz';
	import type { QuizSummary } from '$lib/types/quiz';

	interface Props {
		quiz: QuizSummary;
		onSelect: (quiz: QuizSummary) => void;
		onEdit: (quiz: QuizSummary) => void;
		onDelete: (quiz: QuizSummary) => void;
		onStart: (quiz: QuizSummary) => void;
	}

	let { quiz, onSelect, onEdit, onDelete, onStart }: Props = $props();

	// Для пользователя только два состояния: черновик / опубликован (см. isDraft).
	let draft = $derived(isDraft(quiz.status));
	let status = $derived(
		draft
			? { label: 'Draft', class: 'border-amber-500/20 bg-amber-500/10 text-amber-400' }
			: { label: 'Published', class: 'border-green-500/20 bg-green-500/10 text-green-400' }
	);
	let isPublic = $derived(quiz.visibility === 'PUBLIC');

	let menuOpen = $state(false);

	function act(fn: (q: QuizSummary) => void) {
		menuOpen = false;
		fn(quiz);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(quiz);
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={() => onSelect(quiz)}
	onkeydown={onKey}
	class="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/5 bg-surface text-left shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-2xl"
>
	<!-- Превью (заглушка — поля изображения в API пока нет) -->
	<div class="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
		<div class="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-700">
			<ImageIcon size={36} strokeWidth={1.5} />
			<span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">No preview</span>
		</div>

		<!-- Видимость + статус (слева сверху) -->
		<div class="absolute left-3 top-3 flex items-center gap-2">
			<span
				class={cn(
					'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md',
					isPublic ? 'border-sky-400/20 bg-sky-500/15 text-sky-300' : 'border-white/10 bg-black/50 text-slate-300'
				)}
			>
				{#if isPublic}<Globe size={12} /> Public{:else}<Lock size={12} /> Private{/if}
			</span>
			<span class={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md', status.class)}>
				{status.label}
			</span>
		</div>

		<!-- Меню быстрых действий (справа сверху) -->
		<div class="absolute right-3 top-3">
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); menuOpen = !menuOpen; }}
				aria-label="Quiz actions"
				class="rounded-full bg-black/50 p-2 text-slate-300 backdrop-blur-md transition-colors hover:text-white"
			>
				<MoreVertical size={16} />
			</button>

			{#if menuOpen}
				<!-- backdrop для закрытия по клику вне -->
				<button class="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onclick={(e) => { e.stopPropagation(); menuOpen = false; }}></button>
				<div class="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-surface p-1 shadow-2xl">
					{#if !draft}
						<button onclick={(e) => { e.stopPropagation(); act(onStart); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
							<Play size={15} /> Start
						</button>
					{/if}
					<button onclick={(e) => { e.stopPropagation(); act(onEdit); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
						<Pencil size={15} /> Edit
					</button>
					<button onclick={(e) => { e.stopPropagation(); act(onDelete); }} class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
						<Trash2 size={15} /> Delete
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Тело -->
	<div class="flex flex-1 flex-col gap-2 p-5">
		<h3 class="truncate text-lg font-bold text-white" title={quiz.title}>{quiz.title}</h3>
		<p class="line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-400">
			{quiz.description || 'No description yet.'}
		</p>

		<div class="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
			<span class="flex items-center gap-1.5 text-xs font-medium text-slate-500">
				<Layers size={14} />
				{quiz.cardCount}
				{quiz.cardCount === 1 ? 'card' : 'cards'}
			</span>
		</div>
	</div>
</div>
