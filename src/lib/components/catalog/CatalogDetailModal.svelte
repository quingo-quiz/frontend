<script lang="ts">
	import { X, Play, Layers, CalendarDays } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { CatalogItem } from '$lib/types/quiz';

	interface Props {
		item: CatalogItem | null;
		onClose: () => void;
		onPlay: (item: CatalogItem) => void;
	}

	let { item, onClose, onPlay }: Props = $props();

	const PALETTES = [
		['from-indigo-900', 'to-violet-950'],
		['from-sky-900', 'to-blue-950'],
		['from-emerald-900', 'to-teal-950'],
		['from-amber-900', 'to-orange-950'],
		['from-rose-900', 'to-pink-950'],
		['from-purple-900', 'to-indigo-950'],
		['from-cyan-900', 'to-sky-950'],
		['from-fuchsia-900', 'to-purple-950']
	] as const;

	const AVATAR_COLORS = [
		'bg-indigo-500',
		'bg-sky-500',
		'bg-emerald-500',
		'bg-amber-500',
		'bg-rose-500',
		'bg-purple-500',
		'bg-cyan-500',
		'bg-fuchsia-500'
	] as const;

	function hash(id: string): number {
		let h = 0;
		for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
		return Math.abs(h);
	}

	let gradient = $derived(item ? PALETTES[hash(item.id) % PALETTES.length] : PALETTES[0]);
	let avatarColor = $derived(
		item ? AVATAR_COLORS[hash(item.ownerId) % AVATAR_COLORS.length] : AVATAR_COLORS[0]
	);

	function fmt(d: string): string {
		return new Date(d).toLocaleDateString('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if item}
	<div class="fixed inset-0 z-[3000] flex items-end justify-center sm:items-center sm:px-4">
		<!-- Бэкдроп -->
		<button
			class="absolute inset-0 bg-black/65 backdrop-blur-sm"
			aria-label="Close"
			onclick={onClose}
		></button>

		<!-- Модалка: bottom-sheet на мобилке, по центру на sm+ -->
		<div
			transition:fly={{ y: 48, duration: 260, easing: cubicOut }}
			class="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2rem] border border-white/10 bg-surface shadow-2xl sm:rounded-[2rem]"
		>
			<!-- Превью -->
			<div
				class="relative aspect-video w-full overflow-hidden bg-gradient-to-br {gradient[0]} {gradient[1]}"
			>
				<div
					class="absolute inset-0 opacity-[0.07]"
					style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 22px 22px;"
				></div>
				<div class="absolute inset-0 flex items-center justify-center">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm"
					>
						<svg
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							class="text-white/60"
						>
							<rect x="2" y="5" width="20" height="14" rx="3" />
							<path d="M16 2v4M8 2v4M2 10h20" />
						</svg>
					</div>
				</div>
				<button
					onclick={onClose}
					aria-label="Close"
					class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
				>
					<X size={15} />
				</button>
			</div>

			<!-- Контент -->
			<div class="px-5 pt-5 pb-6">
				<!-- Заголовок -->
				<h2 class="text-xl leading-snug font-bold text-white">{item.title}</h2>

				<!-- Описание -->
				{#if item.description}
					<p class="mt-1.5 text-sm leading-relaxed text-slate-400">{item.description}</p>
				{:else}
					<p class="mt-1.5 text-sm text-slate-600 italic">No description provided.</p>
				{/if}

				<!-- Разделитель -->
				<div class="my-4 border-t border-white/5"></div>

				<!-- Автор + мета в одной строке -->
				<div class="flex items-center justify-between gap-3">
					<!-- Автор -->
					<div class="flex min-w-0 items-center gap-2.5">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {avatarColor}"
						>
							Q
						</div>
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-white">Quingo User</p>
							<p class="text-[11px] text-slate-500">Author</p>
						</div>
					</div>

					<!-- Мета: карточки + даты -->
					<div class="shrink-0 space-y-0.5 text-right text-[11px] text-slate-500">
						<div class="flex items-center justify-end gap-1">
							<Layers size={11} />
							<span>{item.cardCount} {item.cardCount === 1 ? 'question' : 'questions'}</span>
						</div>
						<div class="flex items-center justify-end gap-1">
							<CalendarDays size={11} />
							<span>Created {fmt(item.createdAt)}</span>
						</div>
						{#if item.modifiedAt !== item.createdAt}
							<div class="flex items-center justify-end gap-1 text-slate-600">
								<span>Updated {fmt(item.modifiedAt)}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Play -->
				<button
					type="button"
					onclick={() => onPlay(item!)}
					class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98]"
				>
					<Play size={16} fill="currentColor" /> Play Now
				</button>
			</div>
		</div>
	</div>
{/if}
