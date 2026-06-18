<script lang="ts">
	import { Trash2, Plus, ListChecks, CheckSquare, Type as TypeIcon, Clock } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import { newId, MAX_OPTIONS, MIN_OPTIONS, MIN_TIMER, MAX_TIMER } from '$lib/utils/quiz';
	import type { Card, CardType } from '$lib/types/quiz';

	let { card }: { card: Card } = $props();

	const typeMeta: Record<CardType, { label: string; icon: typeof ListChecks }> = {
		SINGLE_CHOICE: { label: 'Single choice', icon: ListChecks },
		MULTIPLE_CHOICE: { label: 'Multiple choice', icon: CheckSquare },
		TEXT_INPUT: { label: 'Text input', icon: TypeIcon }
	};

	let isChoice = $derived(card.type === 'SINGLE_CHOICE' || card.type === 'MULTIPLE_CHOICE');
	let TypeBadgeIcon = $derived(typeMeta[card.type].icon);

	function toggleCorrect(optId: string) {
		if (!card.options) return;
		if (card.type === 'SINGLE_CHOICE') {
			card.options = card.options.map((o) => ({ ...o, isCorrect: o.id === optId }));
		} else {
			card.options = card.options.map((o) => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o));
		}
	}

	function addOption() {
		if ((card.options?.length ?? 0) >= MAX_OPTIONS) return;
		card.options = [...(card.options ?? []), { id: newId(), text: '', isCorrect: false }];
	}
	function removeOption(optId: string) {
		if (!card.options || card.options.length <= MIN_OPTIONS) return;
		card.options = card.options.filter((o) => o.id !== optId);
	}

	function addAnswer() {
		card.acceptedTexts = [...(card.acceptedTexts ?? []), ''];
	}
	function removeAnswer(i: number) {
		if (!card.acceptedTexts || card.acceptedTexts.length <= 1) return;
		card.acceptedTexts = card.acceptedTexts.filter((_, idx) => idx !== i);
	}

	function clampTimer() {
		const v = Number(card.timerSeconds);
		if (!v || v < MIN_TIMER) card.timerSeconds = MIN_TIMER;
		else if (v > MAX_TIMER) card.timerSeconds = MAX_TIMER;
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Тип (только метка) + таймер -->
	<div class="flex items-center justify-between gap-4">
		<span class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs font-bold text-slate-300">
			<TypeBadgeIcon size={15} class="text-primary" /> {typeMeta[card.type].label}
		</span>

		<div class="flex items-center gap-2">
			<span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Timer</span>
			<div class="relative w-28">
				<Clock size={15} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
				<input
					type="number"
					min={MIN_TIMER}
					max={MAX_TIMER}
					bind:value={card.timerSeconds}
					onblur={clampTimer}
					class="w-full rounded-lg border border-white/10 bg-input-bg py-2 pl-9 pr-3 text-sm text-white transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
				/>
			</div>
		</div>
	</div>

	<!-- Вопрос -->
	<div class="flex flex-col gap-1.5">
		<span class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">Question</span>
		<textarea
			bind:value={card.questionText}
			placeholder="Type your question here..."
			class="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-input-bg p-4 text-base text-white placeholder:text-slate-600 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
		></textarea>
	</div>

	<!-- Данные по типу -->
	{#if isChoice && card.options}
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between px-1">
				<span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">
					Options · {card.type === 'SINGLE_CHOICE' ? 'one correct' : 'one or more correct'}
				</span>
				<span class="text-[10px] text-slate-600">{card.options.length}/{MAX_OPTIONS}</span>
			</div>
			{#each card.options as option (option.id)}
				<div class="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-2 pl-3">
					<button
						type="button"
						onclick={() => toggleCorrect(option.id)}
						aria-label="Mark correct"
						class={cn(
							'flex h-7 w-7 shrink-0 items-center justify-center border-2 transition-all',
							card.type === 'SINGLE_CHOICE' ? 'rounded-full' : 'rounded-md',
							option.isCorrect
								? 'border-green-500 bg-green-500/20 text-green-400'
								: 'border-slate-600 text-transparent hover:border-slate-400'
						)}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg>
					</button>

					<input
						bind:value={option.text}
						placeholder="Option text"
						class="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
					/>

					<button
						type="button"
						onclick={() => removeOption(option.id)}
						disabled={card.options.length <= MIN_OPTIONS}
						aria-label="Remove option"
						class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Trash2 size={16} />
					</button>
				</div>
			{/each}

			<button
				type="button"
				onclick={addOption}
				disabled={card.options.length >= MAX_OPTIONS}
				class="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-500"
			>
				<Plus size={15} /> Add option
			</button>
		</div>
	{:else if card.type === 'TEXT_INPUT' && card.acceptedTexts}
		<div class="flex flex-col gap-2">
			<span class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">Accepted answers</span>
			{#each card.acceptedTexts as _, i (i)}
				<div class="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-2 pl-4">
					<input
						bind:value={card.acceptedTexts[i]}
						placeholder="Accepted answer"
						class="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
					/>
					<button
						type="button"
						onclick={() => removeAnswer(i)}
						disabled={card.acceptedTexts.length <= 1}
						aria-label="Remove answer"
						class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Trash2 size={16} />
					</button>
				</div>
			{/each}
			<button
				type="button"
				onclick={addAnswer}
				class="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-all hover:border-primary/30 hover:text-primary"
			>
				<Plus size={15} /> Add answer
			</button>
			<p class="px-1 text-[10px] text-slate-500">Answers are matched case-insensitively, leading/trailing spaces ignored.</p>
		</div>
	{/if}
</div>
