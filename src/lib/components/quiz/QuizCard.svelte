<script lang="ts">
	import { Globe, Lock, ImageIcon, Layers, Pencil } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import { isDraft } from '$lib/utils/quiz';
	import type { QuizSummary } from '$lib/types/quiz';

	let { quiz, onSelect }: { quiz: QuizSummary; onSelect: (quiz: QuizSummary) => void } = $props();

	// Для пользователя только два состояния: черновик / опубликован (см. isDraft).
	let status = $derived(
		isDraft(quiz.status)
			? { label: 'Draft', class: 'border-amber-500/20 bg-amber-500/10 text-amber-400' }
			: { label: 'Published', class: 'border-green-500/20 bg-green-500/10 text-green-400' }
	);
	let isPublic = $derived(quiz.visibility === 'PUBLIC');
</script>

<button
	type="button"
	onclick={() => onSelect(quiz)}
	class="group flex w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-surface text-left shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-2xl"
>
	<!-- Превью -->
	<div class="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
		{#if quiz.previewImageUrl}
			<img src={quiz.previewImageUrl} alt="" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
		{:else}
			<!-- Заглушка превью -->
			<div class="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-700">
				<ImageIcon size={36} strokeWidth={1.5} />
				<span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">No preview</span>
			</div>
		{/if}

		<!-- Видимость (слева сверху) -->
		<span
			class={cn(
				'absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md',
				isPublic ? 'border-sky-400/20 bg-sky-500/15 text-sky-300' : 'border-white/10 bg-black/50 text-slate-300'
			)}
		>
			{#if isPublic}<Globe size={12} /> Public{:else}<Lock size={12} /> Private{/if}
		</span>

		<!-- Статус (справа сверху) -->
		<span class={cn('absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md', status.class)}>
			{status.label}
		</span>
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
			<span class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-colors group-hover:text-primary">
				<Pencil size={12} /> Open
			</span>
		</div>
	</div>
</button>
