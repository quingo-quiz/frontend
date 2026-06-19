<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import { authService } from '$lib/api/auth';
	import { cn } from '$lib/utils/ui';
	import { User, Settings, LogOut, ChevronDown, LayoutGrid } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let isOpen = $state(false);

	function toggle() {
		isOpen = !isOpen;
	}
	function close() {
		isOpen = false;
	}

	async function handleLogout() {
		close();
		await authService.logout();
		window.location.href = '/auth';
	}
</script>

<div class="relative">
	<button
		onclick={toggle}
		class="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-white/5 focus:outline-none"
	>
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20"
		>
			{userContext.user?.username.charAt(0).toUpperCase()}
		</div>
		<span class="hidden text-sm font-medium text-slate-200 sm:block">
			{userContext.user?.username}
		</span>
		<ChevronDown
			size={14}
			class={cn('text-slate-500 transition-transform', isOpen && 'rotate-180')}
		/>
	</button>

	{#if isOpen}
		<!-- Overlay to close on click outside -->
		<button onclick={close} class="fixed inset-0 z-10 cursor-default" aria-label="Close menu"
		></button>

		<div
			transition:fly={{ y: 10, duration: 200 }}
			class="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-2xl"
		>
			<div class="border-b border-white/5 p-3 sm:hidden">
				<p class="text-xs font-bold tracking-wider text-slate-500 uppercase">Signed in as</p>
				<p class="truncate text-sm font-medium">{userContext.user?.email}</p>
			</div>

			<div class="p-1">
				<a
					href="/quizzes"
					onclick={close}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
				>
					<LayoutGrid size={16} /> My Quizzes
				</a>
				<a
					href="/profile"
					onclick={close}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
				>
					<User size={16} /> Profile
				</a>
				<a
					href="/settings"
					onclick={close}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
				>
					<Settings size={16} /> Settings
				</a>
			</div>

			<div class="border-t border-white/5 p-1">
				<button
					onclick={handleLogout}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
				>
					<LogOut size={16} /> Sign Out
				</button>
			</div>
		</div>
	{/if}
</div>
