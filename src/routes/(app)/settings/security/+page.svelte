<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		Smartphone, 
		LogOut, 
		ShieldCheck, 
		Monitor, 
		Clock, 
		Lock,
		AlertCircle
	} from 'lucide-svelte';
	
	// UI & Logic
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils/ui';
	import { authService } from '$lib/api/auth';
	import { userContext } from '$lib/runes/user.svelte';
	import { toasts } from '$lib/runes/toast.svelte';

	// Local State
	let sessions = $state<any[]>([]);
	let loadingSessions = $state(true);
	let isRevokingAll = $state(false);

	/**
	 * Загрузка списка сессий с обработкой 401/refresh внутри authService
	 */
	async function loadSessions() {
		try {
			const data = await authService.getSessions();
			sessions = data;
		} catch (e: any) {
			toasts.show(e.message || 'Failed to sync sessions', 'error');
		} finally {
			loadingSessions = false;
		}
	}

	onMount(loadSessions);

	/**
	 * Отзыв всех сессий кроме текущей
	 */
	async function handleLogoutAll() {
		if (!confirm('This will log you out from all other devices. Continue?')) return;
		
		isRevokingAll = true;
		try {
			await authService.logoutAll();
			toasts.show('All other sessions have been revoked', 'success');
			await loadSessions();
		} catch (e: any) {
			toasts.show(e.message || 'Action failed', 'error');
		} finally {
			isRevokingAll = false;
		}
	}

	/**
	 * Управление переключателем 2FA
	 */
	function handleToggleMfa() {
		if (!userContext.user?.mfaEnabled) {
			// Если выключено — ведем на страницу настройки
			window.location.href = '/settings/security/setup-mfa';
		} else {
			// Если включено — в этой итерации просто уведомляем (логику удаления добавим позже)
			toasts.show('To disable 2FA, please contact support or use the recovery flow', 'info');
		}
	}

	/**
	 * Красивое форматирование даты и времени
	 */
	function formatSessionDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}) + ' at ' + date.toLocaleTimeString('en-GB', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500 pb-20">
	
	<!-- 1. PASSWORD SECTION -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary">
					<Lock size={20} />
				</div>
				<h3 class="text-xl font-bold text-white">Password</h3>
			</div>
			<Button variant="secondary" class="h-8 px-4 text-[10px] uppercase font-bold tracking-widest opacity-50 cursor-not-allowed">
				Update
			</Button>
		</div>
		<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-slate-950/20">
			<p class="text-sm text-slate-500 italic">Password management fields will be available soon.</p>
		</div>
	</div>

	<!-- 2. TWO-FACTOR AUTHENTICATION -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-6 flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary font-bold shadow-inner">
				<ShieldCheck size={20} />
			</div>
			<h3 class="text-xl font-bold text-white">Security Layer</h3>
		</div>
		
		<div class="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 p-6 transition-all hover:border-white/10">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-slate-900 shadow-inner">
					<Smartphone class={userContext.user?.mfaEnabled ? 'text-primary' : 'text-slate-600'} />
				</div>
				<div>
					<p class="text-sm font-bold text-white">Authenticator App (OTP)</p>
					<p class="text-xs text-slate-500">Google Authenticator, Authy or Microsoft Authenticator</p>
				</div>
			</div>
			
			<!-- Premium Switch -->
			<button 
				onclick={handleToggleMfa}
				aria-label="Toggle MFA"
				class={cn(
					"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none",
					userContext.user?.mfaEnabled ? "bg-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "bg-slate-800"
				)}
			>
				<span 
					class={cn(
						"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out",
						userContext.user?.mfaEnabled ? "translate-x-5" : "translate-x-0"
					)}
				></span>
			</button>
		</div>
	</div>

	<!-- 3. ACTIVE SESSIONS SECTION -->
	<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary">
					<Monitor size={20} />
				</div>
				<h3 class="text-xl font-bold text-white">Active Sessions</h3>
			</div>
			
			<!-- Logout All Button (Styled as Revoke) -->
			<button 
				onclick={handleLogoutAll}
				disabled={loadingSessions || sessions.length <= 1 || isRevokingAll}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/5"
			>
				{#if isRevokingAll}
					<div class="h-3 w-3 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
				{:else}
					<LogOut size={14} />
				{/if}
				Revoke All
			</button>
		</div>

		<div class="space-y-3">
			{#if loadingSessions}
				{#each Array(3) as _}
					<div class="h-24 animate-pulse rounded-2xl bg-white/5 border border-white/5"></div>
				{/each}
			{:else if sessions.length === 0}
				<div class="text-center py-10 rounded-2xl border border-dashed border-white/5">
					<p class="text-slate-500 text-sm">No active sessions found.</p>
				</div>
			{:else}
				{#each sessions as session}
					<div class="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-4 transition-all hover:border-white/10 group">
						<div class="flex items-center gap-4">
							<!-- Device Icon -->
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow-inner group-hover:text-primary group-hover:bg-slate-800 transition-all duration-300">
								<Monitor size={20} strokeWidth={1.5} />
							</div>
							
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<p class="text-xs font-bold uppercase tracking-tight text-slate-200">
										Verified Session
									</p>
									<!-- Бейдж Current (для демонстрации) -->
									<span class="rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-500">
										Online
									</span>
								</div>
								
								<div class="flex flex-col gap-0.5">
									<span class="text-[10px] text-slate-400 font-medium">
										Logged in: {formatSessionDate(session.issuedAt)}
									</span>
									<span class="text-[9px] text-slate-600 font-mono tracking-tighter opacity-70 italic uppercase">
										Token Fingerprint: {session.tokenId.split('-')[0]}...
									</span>
								</div>
							</div>
						</div>
						
						<!-- Clean Individual Logout Action -->
						<button 
							title="Revoke session"
							class="p-3 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
						>
							<LogOut size={20} strokeWidth={2} />
						</button>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Security Tip -->
		<div class="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
			<AlertCircle size={16} class="text-primary shrink-0" />
			<p class="text-[11px] text-slate-400 leading-relaxed font-medium">
				If you notice any unfamiliar sessions, we recommend revoking them immediately and changing your password.
			</p>
		</div>
	</div>
</div>