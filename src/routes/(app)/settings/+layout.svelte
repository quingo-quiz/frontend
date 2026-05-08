<script lang="ts">
	import { page } from '$app/state';
	import { User, Shield, ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';

	let { children } = $props();

	const menuItems = [
		{ id: 'general', label: 'General', icon: User, href: '/settings' },
		{ id: 'security', label: 'Security', icon: Shield, href: '/settings/security' },
	];

	let activeId = $derived(String(page.url.pathname) === '/settings/security' ? 'security' : 'general');
</script>

<!-- 1. MOBILE NAVIGATION (Segmented Control) - FULL WIDTH -->
<nav class="md:hidden sticky top-16 z-40 w-screen bg-background/95 backdrop-blur-sm border-b border-white/5 px-4 py-3">
	<div class="max-w-6xl mx-auto flex p-1 bg-slate-950/80 rounded-xl border border-white/5 shadow-inner">
		{#each menuItems as item}
			<a 
				href={item.href}
				class={cn(
					"flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all duration-200",
					activeId === item.id 
						? "bg-primary text-white shadow-md shadow-primary/20" 
						: "text-slate-500 hover:text-slate-400"
				)}
			>
				<item.icon size={14} strokeWidth={2.5} />
				{item.label}
			</a>
		{/each}
	</div>
</nav>

<div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8 px-4">
	
	<!-- 2. DESKTOP SIDEBAR (Оставляем как было) -->
	<aside class="hidden md:block w-72 shrink-0">
		<div class="flex flex-col gap-1.5 sticky top-24">
			<h2 class="text-2xl font-bold text-white mb-6 px-2 italic">Account Settings</h2>
			
			{#each menuItems as item}
				<a 
					href={item.href}
					class={cn(
						"group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-200",
						activeId === item.id 
							? "bg-surface border-white/10 shadow-xl" 
							: "border-transparent hover:bg-white/5 opacity-60 hover:opacity-100"
					)}
				>
					<div class={cn(
						"w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
						activeId === item.id ? "bg-primary text-white" : "bg-slate-900 text-slate-400 group-hover:text-slate-200"
					)}>
						<item.icon size={20} />
					</div>
					<div class="grow">
						<p class="text-sm font-bold tracking-wide">{item.label}</p>
						<p class="text-[10px] text-slate-500 uppercase font-medium">
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