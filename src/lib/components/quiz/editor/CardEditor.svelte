<script lang="ts">
	import { Trash2, Plus, Copy, Clock, Check } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	import { newOptionId, MAX_OPTIONS, MIN_OPTIONS, MIN_TIMER, MAX_TIMER } from '$lib/utils/quiz';
	import type { Card } from '$lib/types/quiz';

	// $bindable: редактор намеренно мутирует переданную карточку (общий прокси из cards родителя)
	let { card = $bindable() }: { card: Card } = $props();

	let isChoice = $derived(card.type === 'SINGLE_CHOICE' || card.type === 'MULTIPLE_CHOICE');

	function toggleCorrect(optId: number) {
		if (!card.options) return;
		if (card.type === 'SINGLE_CHOICE') {
			card.options = card.options.map((o) => ({ ...o, isCorrect: o.id === optId }));
		} else {
			card.options = card.options.map((o) =>
				o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o
			);
		}
	}

	function addOption() {
		if ((card.options?.length ?? 0) >= MAX_OPTIONS) return;
		card.options = [...(card.options ?? []), { id: newOptionId(), text: '', isCorrect: false }];
	}
	function removeOption(optId: number) {
		if (!card.options || card.options.length <= MIN_OPTIONS) return;
		card.options = card.options.filter((o) => o.id !== optId);
	}
	function duplicateOption(optId: number) {
		if (!card.options || card.options.length >= MAX_OPTIONS) return;
		const idx = card.options.findIndex((o) => o.id === optId);
		if (idx < 0) return;
		const copy = { ...card.options[idx], id: newOptionId() };
		const next = [...card.options];
		next.splice(idx + 1, 0, copy);
		card.options = next;
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
	<!-- Таймер -->
	<div class="flex justify-end">
		<div
			class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1.5"
		>
			<Clock size={15} class="text-slate-500" />
			<input
				type="number"
				min={MIN_TIMER}
				max={MAX_TIMER}
				bind:value={card.timerSeconds}
				onblur={clampTimer}
				class="no-spin w-12 bg-transparent text-center text-sm font-semibold text-white focus:outline-none"
			/>
			<span class="text-xs font-medium text-slate-500">sec</span>
		</div>
	</div>

	<!-- Вопрос: крупное поле без рамки -->
	<textarea
		bind:value={card.questionText}
		rows="2"
		placeholder="Type your question…"
		class="w-full resize-none border-b border-white/10 bg-transparent pb-2 text-2xl font-bold text-white transition-colors placeholder:text-slate-700 focus:border-primary/50 focus:outline-none"
	></textarea>

	<!-- Данные по типу -->
	{#if isChoice && card.options}
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between px-1">
				<span class="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
					Options · {card.type === 'SINGLE_CHOICE' ? 'one correct' : 'one or more correct'}
				</span>
				<span class="text-[10px] text-slate-600">{card.options.length}/{MAX_OPTIONS}</span>
			</div>
			{#each card.options as option (option.id)}
				<div
					class={cn(
						'group flex items-center gap-1.5 rounded-xl border p-2 pl-2.5 transition-colors sm:gap-2 sm:pl-3',
						option.isCorrect
							? 'border-green-500/30 bg-green-500/[0.06]'
							: 'border-white/10 bg-slate-950/40 hover:border-white/20'
					)}
				>
					<button
						type="button"
						onclick={() => toggleCorrect(option.id)}
						aria-label="Mark correct"
						title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
						class={cn(
							'flex h-7 w-7 shrink-0 items-center justify-center border-2 transition-all',
							card.type === 'SINGLE_CHOICE' ? 'rounded-full' : 'rounded-md',
							option.isCorrect
								? 'border-green-500 bg-green-500 text-white'
								: 'border-slate-500 text-transparent hover:border-slate-300'
						)}
					>
						<Check size={16} strokeWidth={3.5} />
					</button>

					<input
						bind:value={option.text}
						placeholder="Option text"
						class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
					/>

					<button
						type="button"
						onclick={() => duplicateOption(option.id)}
						disabled={card.options.length >= MAX_OPTIONS}
						aria-label="Duplicate option"
						title="Duplicate option"
						class="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:p-2"
					>
						<Copy size={15} />
					</button>
					<button
						type="button"
						onclick={() => removeOption(option.id)}
						disabled={card.options.length <= MIN_OPTIONS}
						aria-label="Remove option"
						title="Remove option"
						class="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 sm:p-2"
					>
						<Trash2 size={15} />
					</button>
				</div>
			{/each}

			<button
				type="button"
				onclick={addOption}
				disabled={card.options.length >= MAX_OPTIONS}
				class="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-500"
			>
				<Plus size={15} /> Add option
			</button>
		</div>
	{:else if card.type === 'TEXT_INPUT' && card.acceptedTexts}
		<div class="flex flex-col gap-2">
			<span class="px-1 text-[11px] font-medium tracking-wider text-slate-500 uppercase"
				>Accepted answers</span
			>
			{#each card.acceptedTexts as _, i (i)}
				<div
					class="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-2 pl-4 transition-colors hover:border-white/20"
				>
					<input
						bind:value={card.acceptedTexts[i]}
						placeholder="Accepted answer"
						class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
					/>
					<button
						type="button"
						onclick={() => removeAnswer(i)}
						disabled={card.acceptedTexts.length <= 1}
						aria-label="Remove answer"
						title="Remove answer"
						class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<Trash2 size={15} />
					</button>
				</div>
			{/each}
			<button
				type="button"
				onclick={addAnswer}
				class="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:border-primary/30 hover:text-primary"
			>
				<Plus size={15} /> Add answer
			</button>
			<p class="px-1 text-[10px] text-slate-500">
				Answers are matched case-insensitively, leading/trailing spaces ignored.
			</p>
		</div>
	{/if}
</div>

<style>
	/* Прячем дефолтные стрелки у number-инпута таймера */
	.no-spin::-webkit-outer-spin-button,
	.no-spin::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.no-spin {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
