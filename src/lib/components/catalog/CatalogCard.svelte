<script lang="ts">
	import { Play } from 'lucide-svelte';
	import type { CatalogItem } from '$lib/types/quiz';

	interface Props {
		item: CatalogItem;
		onSelect: (item: CatalogItem) => void;
		onPlay: (item: CatalogItem) => void;
	}

	let { item, onSelect, onPlay }: Props = $props();

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

	let [from, to] = $derived(PALETTES[hash(item.id) % PALETTES.length]);
	let avatarColor = $derived(AVATAR_COLORS[hash(item.ownerId) % AVATAR_COLORS.length]);

	function formatDate(d: string): string {
		return new Date(d).toLocaleDateString('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<!-- Вся карточка кликабельна — открывает детальный просмотр.
     div+role вместо button, чтобы внутри можно было разместить настоящий <button> (Play). -->
<div
	role="button"
	tabindex="0"
	onclick={() => onSelect(item)}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
	class="group flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/5 bg-surface text-left shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:shadow-2xl"
>
	<!-- Превью: цветной градиент -->
	<div class="relative aspect-video w-full overflow-hidden bg-gradient-to-br {from} {to}">
		<div
			class="absolute inset-0 opacity-[0.07]"
			style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 22px 22px;"
		></div>
		<!-- Количество карточек в центре -->
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm"
			>
				<svg
					width="22"
					height="22"
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
			<span class="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
				{item.cardCount}
				{item.cardCount === 1 ? 'question' : 'questions'}
			</span>
		</div>
	</div>

	<!-- Тело карточки -->
	<div class="flex flex-1 flex-col gap-1.5 p-4">
		<h3 class="truncate font-bold text-white" title={item.title}>{item.title}</h3>
		<p class="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-400">
			{item.description || 'No description.'}
		</p>

		<!-- Футер: автор + дата + кнопка Play -->
		<div class="mt-auto flex items-center justify-between pt-3">
			<!-- Автор (заглушка) -->
			<div class="flex min-w-0 items-center gap-2">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white {avatarColor}"
				>
					Q
				</div>
				<div class="min-w-0">
					<p class="truncate text-xs font-medium text-slate-300">Quingo User</p>
					<p class="text-[10px] text-slate-600">{formatDate(item.createdAt)}</p>
				</div>
			</div>

			<!-- Play -->
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onPlay(item);
				}}
				class="ml-2 flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 active:scale-95"
			>
				<Play size={11} fill="currentColor" /> Play
			</button>
		</div>
	</div>
</div>
