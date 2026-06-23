<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, ArrowUpRight } from 'lucide-svelte';
	import { catalogService } from '$lib/api/catalog';
	import { profileService, type UserProfile } from '$lib/api/profile';
	import CatalogCard from '$lib/components/catalog/CatalogCard.svelte';
	import CatalogDetailModal from '$lib/components/catalog/CatalogDetailModal.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import type { CatalogItem } from '$lib/types/quiz';

	const FEATURED_COUNT = 3;

	let user = $derived(userContext.user);

	let items = $state<CatalogItem[]>([]);
	let profiles = $state<Map<string, UserProfile>>(new Map());
	let isLoading = $state(true);
	let selectedItem = $state<CatalogItem | null>(null);

	let selectedProfile = $derived(selectedItem ? profiles.get(selectedItem.ownerId) : undefined);

	onMount(async () => {
		try {
			const result = await catalogService.list({ page: 0, size: FEATURED_COUNT });
			items = result?.items ?? [];

			if (items.length > 0) {
				const ids = [...new Set(items.map((i) => i.ownerId))];
				try {
					const fetched = await profileService.batch(ids);
					const map = new Map<string, UserProfile>();
					for (const p of fetched) map.set(p.id, p);
					profiles = map;
				} catch {
					// Имена авторов не критичны — карточки покажут заглушку
				}
			}
		} catch {
			items = [];
		} finally {
			isLoading = false;
		}
	});

	function handlePlay(_item: CatalogItem) {
		selectedItem = null;
		toasts.show('Live game is coming soon', 'info');
	}
</script>

<svelte:head><title>Quingo — Build quizzes, host them live</title></svelte:head>

<div class="relative mx-auto max-w-7xl overflow-x-clip">
	<!-- Атмосферное свечение (по центру, не смещает макет) -->
	<div
		class="pointer-events-none absolute -top-32 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
	></div>

	<!-- ============ Тезис + действие ============ -->
	<section class="flex flex-col gap-6 pt-8 pb-12 sm:flex-row sm:items-end sm:justify-between sm:pt-14">
		<div class="max-w-xl">
			{#if user}
				<p class="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
					Welcome back, {user.username}
				</p>
			{/if}
			<h1 class="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
				Build quizzes.<br />Host them <span class="text-primary italic">live.</span>
			</h1>
			<p class="mt-4 max-w-md text-base leading-relaxed text-slate-400">
				Create question decks and run live games where players join from any device.
			</p>
		</div>

		<div class="flex shrink-0 gap-3">
			{#if user}
				<a
					href="/quizzes"
					class="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-primary/40 active:scale-[0.97]"
				>
					My Quizzes <ArrowRight size={18} />
				</a>
			{:else}
				<a
					href="/auth"
					class="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-primary/40 active:scale-[0.97]"
				>
					Get started <ArrowRight size={18} />
				</a>
			{/if}
		</div>
	</section>

	<!-- ============ Витрина каталога ============ -->
	<section class="pb-20">
		<div class="mb-5 flex items-end justify-between">
			<p class="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase">Popular now</p>
			<a
				href="/catalog"
				class="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
			>
				Browse all
				<ArrowUpRight size={15} class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			</a>
		</div>

		{#if isLoading}
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(FEATURED_COUNT) as _}
					<div class="overflow-hidden rounded-3xl border border-white/5 bg-surface">
						<div class="aspect-video animate-pulse bg-white/5"></div>
						<div class="space-y-3 p-4">
							<div class="h-4 w-2/3 animate-pulse rounded-full bg-white/5"></div>
							<div class="h-3 w-full animate-pulse rounded-full bg-white/5"></div>
							<div class="h-3 w-1/2 animate-pulse rounded-full bg-white/5"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if items.length === 0}
			<!-- Пустой каталог — мягкая заглушка, без перегруза -->
			<div
				class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-surface/40 py-16 text-center"
			>
				<p class="text-sm font-semibold text-slate-300">No public quizzes yet</p>
				<p class="mt-1 max-w-xs text-sm text-slate-500">
					{user ? 'Publish one and it shows up here.' : 'Be the first to publish one.'}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each items as item (item.id)}
					<CatalogCard
						{item}
						profile={profiles.get(item.ownerId)}
						onSelect={(i) => (selectedItem = i)}
						onPlay={handlePlay}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- Детальный просмотр квиза (как в каталоге) -->
<CatalogDetailModal
	item={selectedItem}
	profile={selectedProfile}
	onClose={() => (selectedItem = null)}
	onPlay={handlePlay}
/>
