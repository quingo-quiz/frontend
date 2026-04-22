<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import UserWidget from './UserWidget.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Search, Bell } from 'lucide-svelte';
	import icon from '$lib/assets/favicon.svg';
</script>

<header class="h-16 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
	<!-- Ограничиваем ширину на десктопе и добавляем паддинги -->
	<div class="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
		
		<!-- Left: Logo & Title -->
		<a href="/" class="flex items-center gap-2.5 shrink-0">
			<img src={icon} alt="Quingo" class="w-7 h-7 sm:w-8 sm:h-8" />
			<span class="text-xl font-bold italic tracking-tight hidden sm:block">Quingo</span>
		</a>

		<!-- Center: Search (Always visible, flexible) -->
		<div class="flex-1 max-w-md relative group">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
			<input 
				type="text" 
				placeholder="Search..." 
				class="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
			/>
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-2 shrink-0">
			{#if userContext.isAuthenticated}
				<button class="p-2 text-slate-500 hover:text-white transition-colors hidden xs:block">
					<Bell size={20} />
				</button>
				<UserWidget />
			{:else}
				<!-- shrink-0 не дает кнопке сжиматься, whitespace-nowrap не дает тексту переноситься -->
				<Button 
					variant="primary" 
					onclick={() => window.location.href = '/auth'} 
					class="text-[10px] sm:text-xs px-3 sm:px-5 py-2 shrink-0 whitespace-nowrap"
				>
					Sign In
				</Button>
			{/if}
		</div>
	</div>
</header>