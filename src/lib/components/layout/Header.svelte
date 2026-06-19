<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import UserWidget from './UserWidget.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Search, Bell } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import icon from '$lib/assets/favicon.svg';

	// Поиск ещё не реализован — мягко сообщаем пользователю (один тост на фокус)
	function notifySearchUnavailable() {
		toasts.show('Search is temporarily unavailable', 'info');
	}
</script>

<header class="sticky top-0 z-50 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md">
	<!-- Ограничиваем ширину на десктопе и добавляем паддинги -->
	<div
		class="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8"
	>
		<!-- Left: Logo & Title -->
		<a href="/" class="flex shrink-0 items-center gap-2.5">
			<img src={icon} alt="Quingo" class="h-7 w-7 sm:h-8 sm:w-8" />
			<span class="hidden text-xl font-bold tracking-tight italic sm:block">Quingo</span>
		</a>

		<!-- Center: Search (Always visible, flexible) -->
		<form
			class="group relative max-w-md flex-1"
			onsubmit={(e) => {
				e.preventDefault();
				notifySearchUnavailable();
			}}
		>
			<Search
				class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary"
				size={16}
			/>
			<input
				type="text"
				placeholder="Search..."
				onfocus={notifySearchUnavailable}
				class="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2 pr-4 pl-9 text-sm transition-all placeholder:text-slate-700 focus:border-primary/50 focus:outline-none"
			/>
		</form>

		<!-- Right: Actions -->
		<div class="flex shrink-0 items-center gap-2">
			{#if userContext.isAuthenticated}
				<button class="xs:block hidden p-2 text-slate-500 transition-colors hover:text-white">
					<Bell size={20} />
				</button>
				<UserWidget />
			{:else}
				<!-- shrink-0 не дает кнопке сжиматься, whitespace-nowrap не дает тексту переноситься -->
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
