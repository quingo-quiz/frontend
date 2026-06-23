<script lang="ts">
	import { Library, BookOpen, User } from 'lucide-svelte';
	import { page } from '$app/stores';

	const links = [
		{ href: '/catalog', label: 'Catalog', icon: Library },
		{ href: '/quizzes', label: 'My Quizzes', icon: BookOpen },
		{ href: '/profile', label: 'Profile', icon: User }
	];
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/5 bg-background/90 backdrop-blur-md sm:hidden"
>
	{#each links as link}
		{@const active = $page.url.pathname.startsWith(link.href)}
		<a
			href={link.href}
			class="flex flex-1 flex-col items-center gap-1 py-3 text-center transition-colors {active
				? 'text-primary'
				: 'text-slate-500 hover:text-slate-300'}"
		>
			<link.icon size={22} />
			<span class="text-[10px] font-medium">{link.label}</span>
		</a>
	{/each}
</nav>
