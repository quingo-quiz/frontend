<script lang="ts">
	import { X, Globe, Lock, ImageIcon, Layers, Play, Pencil } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils/ui';
	import Button from '$lib/components/ui/Button.svelte';
	import type { QuizSummary } from '$lib/types/quiz';

	interface Props {
		quiz: QuizSummary | null;
		canEdit?: boolean; // true только для автора квиза
		onClose: () => void;
		onStart: (quiz: QuizSummary) => void;
		onEdit: (quiz: QuizSummary) => void;
	}

	let { quiz, canEdit = false, onClose, onStart, onEdit }: Props = $props();

	let isPublic = $derived(quiz?.visibility === 'PUBLIC');
</script>

{#if quiz}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/5 bg-surface shadow-2xl"
		>
			<!-- Превью -->
			<div
				class="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950"
			>
				<div class="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-700">
					<ImageIcon size={40} strokeWidth={1.5} />
					<span class="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase"
						>No preview</span
					>
				</div>

				<span
					class={cn(
						'absolute top-4 left-4 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md',
						isPublic
							? 'border-sky-400/20 bg-sky-500/15 text-sky-300'
							: 'border-white/10 bg-black/50 text-slate-300'
					)}
				>
					{#if isPublic}<Globe size={12} /> Public{:else}<Lock size={12} /> Private{/if}
				</span>

				<button
					onclick={onClose}
					aria-label="Close"
					class="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-slate-300 backdrop-blur-md transition-colors hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Контент -->
			<div class="flex flex-col gap-4 p-6 sm:p-8">
				<div>
					<h2 class="text-2xl font-bold text-white">{quiz.title}</h2>
					<p class="mt-2 text-sm leading-relaxed text-slate-400">
						{quiz.description || 'No description.'}
					</p>
				</div>

				<div class="flex items-center gap-2 text-sm font-medium text-slate-400">
					<Layers size={16} />
					{quiz.cardCount}
					{quiz.cardCount === 1 ? 'card' : 'cards'}
				</div>

				<div class="mt-2 flex flex-col gap-3 sm:flex-row">
					<Button onclick={() => onStart(quiz)} class="flex-1 py-3.5">
						<Play size={18} /> Start quiz
					</Button>
					{#if canEdit}
						<Button variant="secondary" onclick={() => onEdit(quiz)} class="sm:w-auto">
							<Pencil size={16} /> Edit
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
