<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import UserWidget from './UserWidget.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Bell } from 'lucide-svelte';
	import { page } from '$app/stores';
	import icon from '$lib/assets/favicon.svg';

	const navLinks = [
		{ href: '/catalog', label: 'Catalog' },
		{ href: '/quizzes', label: 'My Quizzes' }
	];
</script>

<header class="sticky top-0 z-50 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md">
	<div
		class="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
	>
		<!-- Logo -->
		<a href="/" class="flex shrink-0 items-center gap-2.5">
			<img src={icon} alt="Quingo" class="h-7 w-7 sm:h-8 sm:w-8" />
			<span class="hidden text-xl font-bold tracking-tight italic sm:block">Quingo</span>
		</a>

		<!-- Nav -->
		<nav class="hidden items-center gap-0.5 sm:flex">
			{#each navLinks as link}
				<a
					href={link.href}
					class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
						{$page.url.pathname.startsWith(link.href) ? 'text-white' : 'text-slate-500 hover:text-slate-200'}"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Right -->
		<div class="flex shrink-0 items-center gap-2">
			{#if userContext.isAuthenticated}
				<button class="hidden p-2 text-slate-500 transition-colors hover:text-white sm:block">
					<Bell size={20} />
				</button>
				<UserWidget />
			{:else}
				<Button
					variant="primary"
					onclick={() => (window.location.href = '/auth')}
					class="shrink-0 px-3 py-2 text-[10px] whitespace-nowrap sm:px-5 sm:text-xs"
				>
					Sign In
				</Button>
			{/if}
		</div>
	</div>
</header>
