<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import UserWidget from './UserWidget.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Bell, Library, BookOpen } from 'lucide-svelte';
	import { page } from '$app/stores';
	import icon from '$lib/assets/favicon.svg';

	// Константа (не реактивная): иконки — это объекты-компоненты, и попадание
	// их в реактивный $derived ломает dev-сравнение Svelte. Фильтр по авторизации
	// делаем в шаблоне. `protected: true` — пункт только для залогиненных.
	const navLinks = [
		{ href: '/catalog', label: 'Catalog', icon: Library, protected: false },
		{ href: '/quizzes', label: 'My Quizzes', icon: BookOpen, protected: true }
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

		<!-- Nav: иконка + подпись, видна на всех размерах экрана -->
		<nav class="flex items-center gap-0.5">
			{#each navLinks as link}
				{#if !link.protected || userContext.isAuthenticated}
					{@const active = $page.url.pathname.startsWith(link.href)}
					<a
						href={link.href}
						class="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors
							{active ? 'text-white' : 'text-slate-500 hover:text-slate-200'}"
					>
						<link.icon size={18} />
						<span class="text-[10px] font-medium leading-none">{link.label}</span>
					</a>
				{/if}
			{/each}
		</nav>

		<!-- Right -->
		<div class="flex shrink-0 items-center gap-2">
			{#if userContext.isLoading}
				<!-- Нейтральная заглушка, чтобы не мигать Sign In → виджет юзера -->
				<div class="h-9 w-9 animate-pulse rounded-full bg-white/5"></div>
			{:else if userContext.isAuthenticated}
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
