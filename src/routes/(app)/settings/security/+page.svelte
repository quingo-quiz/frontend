<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		Smartphone, LogOut, ShieldCheck, Monitor, Clock, Lock, AlertCircle, Key
	} from 'lucide-svelte';
	
	// UI & Logic
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils/ui';
	import { authService } from '$lib/api/auth';
	import { userContext } from '$lib/runes/user.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import type { SecurityStatusDto, SessionModel } from '$lib/types/auth';

	// Local State
	let securityStatus = $state<SecurityStatusDto | null>(null);
	let sessions = $state<SessionModel[]>([]);
	let loadingData = $state(true); // Общий лоадер для всех данных
	let isRevokingAll = $state(false);
	let isRevokingSingleSession: Record<string, boolean> = $state({}); // Для каждой сессии отдельно

	/**
	 * Загрузка всех необходимых данных для страницы
	 */
	async function loadSecurityData() {
		try {
			// Параллельная загрузка статуса безопасности и сессий
			const [status, sData] = await Promise.all([
				authService.getSecurityStatus(),
				authService.getSessions()
			]);
			securityStatus = status;
			sessions = sData;
		} catch (e: any) {
			toasts.show(e.message || 'Failed to load security data', 'error');
		} finally {
			loadingData = false;
		}
	}

	onMount(loadSecurityData);

	/**
	 * Отзыв всех сессий кроме текущей
	 */
	async function handleLogoutAll() {
		if (!confirm('This will log you out from all other devices. Continue?')) return;
		
		isRevokingAll = true;
		try {
			await authService.logoutAll();
			toasts.show('All other sessions have been revoked', 'success');
			await loadSecurityData(); // Перезагружаем все данные
		} catch (e: any) {
			toasts.show(e.message || 'Action failed', 'error');
		} finally {
			isRevokingAll = false;
		}
	}

	/**
	 * Отзыв одной конкретной сессии
	 */
	async function handleRevokeSingleSession(tokenId: string) {
		if (!confirm('Are you sure you want to revoke this session?')) return;

		isRevokingSingleSession[tokenId] = true;
		try {
			await authService.revokeSingleSession(tokenId);
			toasts.show('Session revoked successfully', 'success');
			await loadSecurityData(); // Перезагружаем все данные
		} catch (e: any) {
			toasts.show(e.message || 'Failed to revoke session', 'error');
		} finally {
			isRevokingSingleSession[tokenId] = false;
		}
	}

	/**
	 * Управление переключателем 2FA
	 */
	function handleToggleMfa() {
		if (!securityStatus?.mfaEnabled) {
			window.location.href = '/settings/security/setup-mfa';
		} else {
			// Логика отключения 2FA:
			// Здесь мы должны показать модальное окно для ввода OTP,
			// а затем вызвать authService.disableMfa(code);
			toasts.show('Disabling 2FA requires confirmation (not implemented yet)', 'info');
		}
	}

	/**
	 * Форматирование даты и времени для сессий
	 */
	function formatSessionDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric'
		}) + ' at ' + date.toLocaleTimeString('en-GB', { 
			hour: '2-digit', minute: '2-digit' 
		});
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500 pb-20">
	
	<!-- Общий лоадер для страницы -->
	{#if loadingData}
		<div class="flex flex-col gap-4">
			<div class="h-48 animate-pulse rounded-4xl bg-white/5"></div>
			<div class="h-48 animate-pulse rounded-4xl bg-white/5"></div>
			<div class="h-72 animate-pulse rounded-4xl bg-white/5"></div>
		</div>
	{:else if !securityStatus}
		<div class="text-center py-20 rounded-4xl border border-dashed border-white/10 bg-surface text-slate-500">
			<p class="text-lg font-bold mb-2">Error Loading Data</p>
			<p class="text-sm">Please try refreshing the page.</p>
		</div>
	{:else}
		<!-- 1. PASSWORD SECTION -->
		<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary">
						<Lock size={20} />
					</div>
					<h3 class="text-xl font-bold text-white">Password</h3>
				</div>
				<!-- Кнопка Set/Change Password -->
				<Button variant="secondary" class="h-8 px-4 text-[10px] uppercase font-bold tracking-widest">
					{#if securityStatus.passwordSet}
						Change
					{:else}
						Set Password
					{/if}
				</Button>
			</div>
			<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-slate-950/20">
				{#if securityStatus.passwordSet}
					<p class="text-sm text-slate-500 italic">Manage your password here.</p>
				{:else}
					<p class="text-sm text-slate-500 italic">You logged in via OAuth. Set a password for direct login.</p>
				{/if}
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
						<Smartphone class={securityStatus.mfaEnabled ? 'text-primary' : 'text-slate-600'} />
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
						securityStatus.mfaEnabled ? "bg-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "bg-slate-800"
					)}
				>
					<span 
						class={cn(
							"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out",
							securityStatus.mfaEnabled ? "translate-x-5" : "translate-x-0"
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
					disabled={loadingData || sessions.length <= 1 || isRevokingAll}
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
				{#if loadingData}
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
								<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow-inner group-hover:text-primary group-hover:bg-slate-800 transition-all duration-300">
									<Monitor size={20} strokeWidth={1.5} />
								</div>
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<p class="text-xs font-bold uppercase tracking-tight text-slate-200">
											Device Session ({session.os} / {session.browser})
										</p>
										<!-- Отображение Current Session -->
										{#if session.isCurrent}
											<span class="rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-500">
												Current
											</span>
										{/if}
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="text-[10px] text-slate-400 font-medium">
											Logged in: {formatSessionDate(session.issuedAt)} from {session.ipAddress}
										</span>
										<span class="text-[9px] text-slate-600 font-mono tracking-tighter opacity-70 italic uppercase">
											Token ID: {session.tokenId.split('-')[0]}...
										</span>
									</div>
								</div>
							</div>
							
							<!-- Кнопка отзыва сессии (не отображается для текущей) -->
							{#if !session.isCurrent}
								<button 
									onclick={() => handleRevokeSingleSession(session.tokenId)}
									disabled={isRevokingSingleSession[session.tokenId]}
									title="Revoke this session"
									class="p-3 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
								>
									{#if isRevokingSingleSession[session.tokenId]}
										<div class="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
									{:else}
										<LogOut size={20} strokeWidth={2} />
									{/if}
								</button>
							{/if}
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
	{/if}
</div>