<script lang="ts">
	import { page } from '$app/state';
	import { User, Shield, ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';

	let { children } = $props();

	const menuItems = [
		{ id: 'general', label: 'General', icon: User, href: '/settings' },
		{ id: 'security', label: 'Security', icon: Shield, href: '/settings/security' }
	];

	let activeId = $derived(
		String(page.url.pathname) === '/settings/security' ? 'security' : 'general'
	);
</script>

<!-- 1. MOBILE NAVIGATION (Segmented Control) - FULL WIDTH -->
<nav
	class="sticky top-16 z-40 w-screen border-b border-white/5 bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden"
>
	<div
		class="mx-auto flex max-w-6xl rounded-xl border border-white/5 bg-slate-950/80 p-1 shadow-inner"
	>
		{#each menuItems as item}
			<a
				href={item.href}
				class={cn(
					'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-200',
					activeId === item.id
						? 'bg-primary text-white shadow-md shadow-primary/20'
						: 'text-slate-500 hover:text-slate-400'
				)}
			>
				<item.icon size={14} strokeWidth={2.5} />
				{item.label}
			</a>
		{/each}
	</div>
</nav>

<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:gap-8">
	<!-- 2. DESKTOP SIDEBAR (Оставляем как было) -->
	<aside class="hidden w-72 shrink-0 md:block">
		<div class="sticky top-24 flex flex-col gap-1.5">
			<h2 class="mb-6 px-2 text-2xl font-bold text-white italic">Account Settings</h2>

			{#each menuItems as item}
				<a
					href={item.href}
					class={cn(
						'group flex items-center gap-4 rounded-2xl border p-3 transition-all duration-200',
						activeId === item.id
							? 'border-white/10 bg-surface shadow-xl'
							: 'border-transparent opacity-60 hover:bg-white/5 hover:opacity-100'
					)}
				>
					<div
						class={cn(
							'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
							activeId === item.id
								? 'bg-primary text-white'
								: 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
						)}
					>
						<item.icon size={20} />
					</div>
					<div class="grow">
						<p class="text-sm font-bold tracking-wide">{item.label}</p>
						<p class="text-[10px] font-medium text-slate-500 uppercase">
							{item.id === 'general' ? 'Profile & preferences' : 'Password & 2FA'}
						</p>
					</div>
					{#if activeId === item.id}
						<ChevronRight size={16} class="text-primary" />
					{/if}
				</a>
			{/each}
		</div>
	</aside>

	<!-- CONTENT AREA -->
	<main class="grow pb-20">
		{@render children()}
	</main>
</div>
