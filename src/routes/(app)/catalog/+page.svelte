<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { catalogService } from '$lib/api/catalog';
	import { profileService, type UserProfile } from '$lib/api/profile';
	import CatalogCard from '$lib/components/catalog/CatalogCard.svelte';
	import CatalogDetailModal from '$lib/components/catalog/CatalogDetailModal.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import type { CatalogItem, CatalogPage } from '$lib/types/quiz';

	const PAGE_SIZE_OPTIONS = [6, 12, 24];

	let searchInput = $state('');
	let query = $state('');
	let page = $state(0);
	let pageSize = $state(12);
	let result = $state<CatalogPage | null>(null);
	let isLoading = $state(true);
	let selectedItem = $state<CatalogItem | null>(null);
	let profiles = $state<Map<string, UserProfile>>(new Map());

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function load() {
		isLoading = true;
		try {
			result = await catalogService.list({ q: query || undefined, page, size: pageSize });

			if (result && result.items.length > 0) {
				const uniqueIds = [...new Set(result.items.map((i) => i.ownerId))];
				try {
					const fetched = await profileService.batch(uniqueIds);
					const map = new Map<string, UserProfile>();
					for (const p of fetched) map.set(p.id, p);
					profiles = map;
				} catch {
					// Профили не удалось загрузить — показываем заглушку
				}
			}
		} catch (e: any) {
			toasts.show(e?.message || 'Failed to load catalog', 'error');
			result = null;
		} finally {
			isLoading = false;
		}
	}

	function handleSearchInput(value: string) {
		searchInput = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			query = value.trim();
			page = 0;
			load();
		}, 320);
	}

	function handlePageSize(size: number) {
		pageSize = size;
		page = 0;
		load();
	}

	function goToPage(p: number) {
		page = p;
		load();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handlePlay(_item: CatalogItem) {
		selectedItem = null;
		toasts.show('Live game is coming soon', 'info');
	}

	onMount(load);

	function paginationPages(current: number, total: number): (number | '…')[] {
		if (total <= 1) return [];
		if (total <= 7) return Array.from({ length: total }, (_, i) => i);
		const pages: (number | '…')[] = [0];
		const lo = Math.max(1, current - 1);
		const hi = Math.min(total - 2, current + 1);
		if (lo > 1) pages.push('…');
		for (let i = lo; i <= hi; i++) pages.push(i);
		if (hi < total - 2) pages.push('…');
		pages.push(total - 1);
		return pages;
	}

	let pages = $derived(paginationPages(page, result?.totalPages ?? 0));
	let selectedProfile = $derived(selectedItem ? profiles.get(selectedItem.ownerId) : undefined);
</script>

<svelte:head><title>Catalog · Quingo</title></svelte:head>

<div class="mx-auto max-w-7xl">
	<!-- Компактный hero: заголовок слева + поиск справа на sm+ -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-white italic">Discover Quizzes</h1>
			<p class="mt-1 text-sm text-slate-500">Browse public quizzes from the community</p>
		</div>

		<!-- Поиск -->
		<div class="relative w-full sm:max-w-xs">
			<Search
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-500"
				size={15}
			/>
			<input
				type="search"
				placeholder="Search quizzes..."
				value={searchInput}
				oninput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
				class="w-full rounded-xl border border-white/10 bg-surface py-2.5 pr-4 pl-10 text-sm text-white transition-all placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Счётчик + селектор размера страницы -->
	{#if !isLoading && result}
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs text-slate-600">
				{#if query}
					<span class="font-semibold text-slate-400">{result.total}</span> result{result.total !== 1 ? 's' : ''} for
					<span class="font-semibold text-slate-400">"{query}"</span>
				{:else}
					<span class="font-semibold text-slate-400">{result.total}</span> public quiz{result.total !== 1 ? 'zes' : ''} available
				{/if}
				{#if (result.totalPages ?? 0) > 1}
					&nbsp;· page <span class="font-semibold text-slate-400">{page + 1}</span> of <span class="font-semibold text-slate-400">{result.totalPages}</span>
				{/if}
			</p>

			<div class="flex items-center gap-2 text-xs text-slate-500">
				<span>Per page:</span>
				<div class="inline-flex rounded-lg border border-white/5 bg-slate-950/60 p-0.5">
					{#each PAGE_SIZE_OPTIONS as size}
						<button
							onclick={() => handlePageSize(size)}
							class="rounded-md px-2.5 py-1 text-xs font-bold transition-all
								{pageSize === size ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}"
						>
							{size}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<!-- Скелетоны -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{#each Array(pageSize) as _}
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
	{:else if !result || result.items.length === 0}
		<!-- Пустое состояние -->
		<div
			class="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/10 bg-surface/50 py-24 text-center"
		>
			<div
				class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-slate-600"
			>
				<Search size={28} />
			</div>
			<h2 class="text-lg font-bold text-white">
				{query ? 'No quizzes found' : 'Catalog is empty'}
			</h2>
			<p class="mt-1 max-w-xs text-sm text-slate-500">
				{query
					? 'Try a different search term.'
					: 'No public quizzes yet. Be the first to publish one!'}
			</p>
			{#if query}
				<button
					onclick={() => {
						searchInput = '';
						handleSearchInput('');
					}}
					class="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
				>
					Clear search
				</button>
			{/if}
		</div>
	{:else}
		<!-- Сетка карточек -->
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
			{#each result.items as item (item.id)}
				<CatalogCard
					{item}
					profile={profiles.get(item.ownerId)}
					onSelect={(i) => (selectedItem = i)}
					onPlay={handlePlay}
				/>
			{/each}
		</div>

		<!-- Пагинация -->
		{#if (result.totalPages ?? 0) > 1}
			<div class="mt-10 flex items-center justify-center gap-1.5">
				<button
					onclick={() => goToPage(page - 1)}
					disabled={page === 0}
					aria-label="Previous page"
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronLeft size={16} />
				</button>

				{#each pages as p}
					{#if p === '…'}
						<span class="flex h-9 w-9 items-center justify-center text-sm text-slate-600">…</span>
					{:else}
						<button
							onclick={() => goToPage(p)}
							aria-label="Page {p + 1}"
							aria-current={p === page ? 'page' : undefined}
							class="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors
								{p === page
								? 'border-primary/30 bg-primary/15 text-primary'
								: 'border-white/10 bg-surface text-slate-400 hover:border-white/20 hover:text-white'}"
						>
							{p + 1}
						</button>
					{/if}
				{/each}

				<button
					onclick={() => goToPage(page + 1)}
					disabled={page >= (result.totalPages ?? 1) - 1}
					aria-label="Next page"
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface text-slate-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronRight size={16} />
				</button>
			</div>
		{/if}
	{/if}
</div>

<!-- Детальный просмотр квиза -->
<CatalogDetailModal
	item={selectedItem}
	profile={selectedProfile}
	onClose={() => (selectedItem = null)}
	onPlay={handlePlay}
/>
