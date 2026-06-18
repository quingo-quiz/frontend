<script lang="ts">
	import { X, Sparkles, Globe, Lock } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { cn } from '$lib/utils/ui';
	import type { CreateQuizRequest, QuizVisibility } from '$lib/types/quiz';

	interface Props {
		isOpen: boolean;
		isSubmitting?: boolean;
		onClose: () => void;
		onCreate: (data: CreateQuizRequest) => void;
	}

	let { isOpen, isSubmitting = false, onClose, onCreate }: Props = $props();

	let title = $state('');
	let description = $state('');
	let visibility = $state<QuizVisibility>('PRIVATE');
	let fieldError = $state('');

	// Сброс формы при открытии/закрытии
	$effect(() => {
		if (!isOpen) {
			title = '';
			description = '';
			visibility = 'PRIVATE';
			fieldError = '';
		}
	});

	function handleSubmit() {
		if (title.trim().length < 1) {
			fieldError = 'Title is required';
			return;
		}
		onCreate({ title: title.trim(), description: description.trim() || undefined, visibility });
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
	>
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="w-full max-w-md rounded-[2rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-8"
		>
			<div class="mb-6 flex items-start justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
						<Sparkles size={20} />
					</div>
					<h3 class="text-xl font-bold text-white">New Quiz</h3>
				</div>
				<button onclick={onClose} aria-label="Close" class="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white">
					<X size={20} />
				</button>
			</div>

			<form class="space-y-5" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<Input bind:value={title} label="Title" placeholder="My awesome quiz" error={fieldError} />

				<div class="flex flex-col gap-1.5">
					<label class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500" for="quiz-description">Description</label>
					<textarea
						id="quiz-description"
						bind:value={description}
						placeholder="What is this quiz about? (optional)"
						class="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-input-bg p-3 text-sm text-white placeholder:text-slate-600 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
					></textarea>
				</div>

				<!-- Видимость (сегментированный переключатель, как в редакторе) -->
				<div class="flex flex-col gap-1.5">
					<span class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">Visibility</span>
					<div class="grid grid-cols-2 rounded-xl border border-white/5 bg-slate-950/60 p-1">
						<button
							type="button"
							onclick={() => (visibility = 'PRIVATE')}
							class={cn(
								'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all',
								visibility === 'PRIVATE' ? 'bg-slate-500/20 text-slate-100' : 'text-slate-500 hover:text-slate-300'
							)}
						>
							<Lock size={14} /> Private
						</button>
						<button
							type="button"
							onclick={() => (visibility = 'PUBLIC')}
							class={cn(
								'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all',
								visibility === 'PUBLIC' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'
							)}
						>
							<Globe size={14} /> Public
						</button>
					</div>
					<p class="px-1 text-[10px] leading-relaxed text-slate-500">
						{#if visibility === 'PUBLIC'}
							Public: anyone can find it in the catalog & search, start it and host games.
						{:else}
							Private: only you (the author) can start and host this quiz.
						{/if}
					</p>
				</div>

				<Button type="submit" isLoading={isSubmitting} class="w-full py-4 text-base">Create Quiz</Button>
			</form>
		</div>
	</div>
{/if}
