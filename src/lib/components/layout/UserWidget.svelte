<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import { authService } from '$lib/api/auth';
	import { cn } from '$lib/utils/ui';
	import { User, Settings, LogOut, ChevronDown, LayoutGrid } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let isOpen = $state(false);

	function toggle() { isOpen = !isOpen; }
	function close() { isOpen = false; }

	async function handleLogout() {
		close();
		await authService.logout();
		window.location.href = '/auth';
	}
</script>

<div class="relative">
	<button 
		onclick={toggle}
		class="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
	>
		<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
			{userContext.user?.username.charAt(0).toUpperCase()}
		</div>
		<span class="hidden sm:block text-sm font-medium text-slate-200">
			{userContext.user?.username}
		</span>
		<ChevronDown size={14} class={cn("text-slate-500 transition-transform", isOpen && "rotate-180")} />
	</button>

	{#if isOpen}
		<!-- Overlay to close on click outside -->
		<button 
			onclick={close} 
			class="fixed inset-0 z-10 cursor-default" 
			aria-label="Close menu"
		></button>

		<div 
			transition:fly={{ y: 10, duration: 200 }}
			class="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
		>
			<div class="p-3 border-b border-white/5 sm:hidden">
				<p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Signed in as</p>
				<p class="text-sm font-medium truncate">{userContext.user?.email}</p>
			</div>

			<div class="p-1">
				<a
					href="/quizzes"
					onclick={close}
					class="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
				>
					<LayoutGrid size={16} /> My Quizzes
				</a>
				<a
					href="/profile"
					onclick={close}
					class="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
				>
					<User size={16} /> Profile
				</a>
				<a 
					href="/settings" 
					onclick={close}
					class="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
				>
					<Settings size={16} /> Settings
				</a>
			</div>

			<div class="p-1 border-t border-white/5">
				<button 
					onclick={handleLogout}
					class="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
				>
					<LogOut size={16} /> Sign Out
				</button>
			</div>
		</div>
	{/if}
</div>