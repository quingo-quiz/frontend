<script lang="ts">
	import { onMount } from 'svelte';
	import { Smartphone, LogOut, ShieldCheck, Monitor, Clock, ChevronRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { userContext } from '$lib/runes/user.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { cn } from '$lib/utils/ui';

	let sessions = $state<any[]>([]);
	let loadingSessions = $state(true);

	onMount(async () => {
		try {
			sessions = await authService.getSessions();
		} finally {
			loadingSessions = false;
		}
	});

	function formatFullDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	// Функция для переключения (будет вести на настройку если OFF)
	function handleToggleMfa() {
		if (!userContext.user?.mfaEnabled) {
			window.location.href = '/settings/security/setup-mfa';
		} else {
			toasts.show('Disabling MFA requires confirmation', 'info');
		}
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
	
	<!-- 1. Password Section -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary">
					<Clock size={20} />
				</div>
				<h3 class="text-xl font-bold">Password</h3>
			</div>
			<Button variant="secondary" class="h-8 px-4 text-[10px] uppercase">Update</Button>
		</div>
		<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center">
			<p class="text-sm text-slate-500 italic">Password fields will appear here in the next update.</p>
		</div>
	</div>

	<!-- 2. 2FA Section with Toggle -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-6 flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary">
				<ShieldCheck size={20} />
			</div>
			<h3 class="text-xl font-bold">Two-Factor Authentication</h3>
		</div>
		
		<div class="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 p-6">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-slate-900 shadow-inner">
					<Smartphone class={userContext.user?.mfaEnabled ? 'text-primary' : 'text-slate-600'} />
				</div>
				<div>
					<p class="text-sm font-bold">Authenticator App</p>
					<p class="text-xs text-slate-500">Google Authenticator or Authy</p>
				</div>
			</div>
			
			<!-- Custom Switch (Toggle) -->
			<button 
				onclick={handleToggleMfa}
				class={cn(
					"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
					userContext.user?.mfaEnabled ? "bg-primary" : "bg-slate-700"
				)}
			>
				<span 
					class={cn(
						"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
						userContext.user?.mfaEnabled ? "translate-x-5" : "translate-x-0"
					)}
				></span>
			</button>
		</div>
	</div>

	<!-- 3. Sessions Section -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-8 flex items-center justify-between">
			<h3 class="text-xl font-bold">Active Sessions</h3>
			<button class="text-xs font-bold text-red-400/80 transition-colors hover:text-red-400 uppercase tracking-widest">
				Revoke All
			</button>
		</div>

		<div class="space-y-3">
			{#if loadingSessions}
				<div class="h-20 animate-pulse rounded-2xl bg-white/5"></div>
			{:else}
				{#each sessions as session}
					<div class="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-4 transition-colors hover:border-white/10 group">
						<div class="flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow-inner group-hover:text-primary transition-colors">
								<Monitor size={20} strokeWidth={1.5} />
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<p class="text-xs font-bold uppercase tracking-tight text-slate-200">Device Session</p>
									<span class="rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-500">Current</span>
								</div>
								<div class="flex flex-col text-[10px] text-slate-500">
									<span class="text-slate-400 font-medium">Log in: {formatFullDate(session.issuedAt)}</span>
									<span class="opacity-50 italic">ID: {session.tokenId.split('-')[0]}...</span>
								</div>
							</div>
						</div>
						<!-- Выделенная кнопка выхода -->
						<button class="p-2.5 rounded-xl bg-red-500/5 text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20">
							<LogOut size={18} />
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>