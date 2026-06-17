<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogOut, ShieldCheck, Monitor, Lock } from 'lucide-svelte';
	
	// UI & Logic
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils/ui';
	import { authService } from '$lib/api/auth';
	import { securityContext } from '$lib/runes/security.svelte'; // Используем securityContext
	import { toasts } from '$lib/runes/toast.svelte';
	import type { SessionModel } from '$lib/types/auth';

    // Импортируем компонент модального окна для пароля
	import PasswordModal from '$lib/components/security/PasswordModal.svelte';
	import OtpDisableModal from '$lib/components/security/OtpDisableModal.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	// Local State
	let sessions = $state<SessionModel[]>([]);
	let isRevokingAll = $state(false);
	let isRevokingSingleSession: Record<string, boolean> = $state({}); // Для каждой сессии отдельно
    let showPasswordModal = $state(false); // Состояние видимости модального окна для пароля
    let showOtpDisableModal = $state(false);
	let showConfirmRevokeAll = $state(false);
	let showConfirmRevokeSingle = $state<null | { tokenId: string, title?: string, message?: string }>(null);

	/**
	 * Загрузка всех необходимых данных для страницы
	 * (sessions, securityStatus уже загружается в (app)/+layout.svelte)
	 */
	async function loadPageData() {
		try {
			// Обновляем только сессии, securityContext уже должен быть загружен
			sessions = await authService.getSessions();
		} catch (e: any) {
			toasts.show(e.message || 'Failed to load sessions', 'error');
		}
	}

	// Ждем, пока securityContext загрузится глобально, и подгружаем сессии
	$effect(() => {
		if (!securityContext.isLoading && securityContext.status) {
			loadPageData();
		}
	});

	/**
	 * Отзыв всех сессий кроме текущей
	 */
	async function handleLogoutAll() {
		showConfirmRevokeAll = false;
		isRevokingAll = true;
		try {
			await authService.logoutAll();
			toasts.show('All other sessions have been revoked', 'success');
			await loadPageData(); // Перезагружаем сессии
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
		// hide confirm
		showConfirmRevokeSingle = null;
		isRevokingSingleSession = { ...isRevokingSingleSession, [tokenId]: true };
		try {
			await authService.revokeSingleSession(tokenId);
			toasts.show('Session revoked successfully', 'success');
			// If the revoked session was current, perform logout
			const s = sessions.find(s => s.tokenId === tokenId);
			const isCurrent = (s as any)?.current ?? s?.isCurrent;
			if (isCurrent) {
				// log out the user
				await authService.logout();
				return; // authService.logout will handle userContext logout and redirect
			}
			await loadPageData(); // Перезагружаем сессии
		} catch (e: any) {
			toasts.show(e.message || 'Failed to revoke session', 'error');
		} finally {
			isRevokingSingleSession = { ...isRevokingSingleSession, [tokenId]: false };
		}
	}

	/**
	 * Управление переключателем 2FA
	 */
	function handleToggleMfa() {
		if (!securityContext.status?.mfaEnabled) {
			goto('/settings/security/setup-mfa');
		} else {
			showOtpDisableModal = true;
		}
	}

	async function handleOtpDisabled() {
		await securityContext.refreshStatus();
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
	{#if securityContext.isLoading}
		<div class="space-y-6">
			<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 animate-pulse rounded-xl bg-white/5"></div>
					<div class="space-y-2">
						<div class="h-4 w-36 animate-pulse rounded-full bg-white/5"></div>
						<div class="h-3 w-56 animate-pulse rounded-full bg-white/5"></div>
					</div>
				</div>
				<div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each Array(3) as _}
						<div class="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/5"></div>
					{/each}
				</div>
			</div>
			<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 animate-pulse rounded-xl bg-white/5"></div>
					<div class="space-y-2">
						<div class="h-4 w-40 animate-pulse rounded-full bg-white/5"></div>
						<div class="h-3 w-52 animate-pulse rounded-full bg-white/5"></div>
					</div>
				</div>
				<div class="mt-8 space-y-4">
					<div class="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/5"></div>
					<div class="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/5"></div>
				</div>
			</div>
		</div>
	{:else if !securityContext.status}
		<div class="text-center py-20 rounded-4xl border border-dashed border-white/10 bg-surface text-slate-500">
			<p class="text-lg font-bold mb-2">Error Loading Security Data</p>
			<p class="text-sm">Please try refreshing the page or check your connection.</p>
		</div>
	{:else}
		<!-- 1. PASSWORD SECTION -->
		<div class="rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
			<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-3 min-w-0">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-950 text-primary shrink-0">
						<Lock size={20} />
					</div>
					<div class="min-w-0">
						<h3 class="text-xl font-bold text-white">Password</h3>
					</div>
				</div>
				<Button 
					variant={securityContext.status.passwordSet ? 'secondary' : 'primary'}
					onclick={() => (showPasswordModal = true)} 
					class={cn(
						"h-10 px-5 text-[10px] uppercase font-bold tracking-widest sm:shrink-0",
						!securityContext.status.passwordSet && "shadow-lg shadow-primary/20"
					)}
				>
					{#if securityContext.status.passwordSet}
						Change Password
					{:else}
						Set Password
					{/if}
				</Button>
			</div>
			<div class={cn(
				"rounded-2xl border px-5 py-4 flex items-center justify-between gap-4",
				securityContext.status.passwordSet
					? "border-green-500/10 bg-green-500/5"
					: "border-amber-500/10 bg-amber-500/5"
			)}>
				<p class="text-sm text-slate-300">
					{#if securityContext.status.passwordSet}
						Password configured.
					{:else}
						Password not set.
					{/if}
				</p>
				<span class={cn(
					"whitespace-nowrap rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest",
					securityContext.status.passwordSet
						? "border-green-500/20 bg-green-500/10 text-green-500"
						: "border-amber-500/20 bg-amber-500/10 text-amber-400"
				)}>
					{securityContext.status.passwordSet ? 'Configured' : 'Not Set'}
				</span>
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
			
			<div class="flex flex-col gap-5 rounded-2xl border border-white/5 bg-slate-950/50 p-6 transition-all hover:border-white/10 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-slate-900 shadow-inner">
							<Monitor class={securityContext.status.mfaEnabled ? 'text-primary' : 'text-slate-600'} />
						</div>
					<div>
						<p class="text-sm font-bold text-white">Authenticator App)</p>
						<p class="text-xs text-slate-500">Use an authenticator app to generate one time passwords</p>
					</div>
				</div>
				
				<div class="flex flex-col items-start gap-3 sm:items-end">
					<button 
						onclick={handleToggleMfa}
						aria-label="Toggle MFA"
						class={cn(
							"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none",
							securityContext.status.mfaEnabled ? "bg-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "bg-slate-800"
						)}
					>
						<span 
							class={cn(
								"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out",
								securityContext.status.mfaEnabled ? "translate-x-5" : "translate-x-0"
							)}
						></span>
					</button>
				</div>
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
				
				<!-- Logout All Button - Always Active -->
				<button 
					onclick={() => (showConfirmRevokeAll = true)}
					disabled={securityContext.isLoading || isRevokingAll}
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

			<div class="space-y-2">
				{#if securityContext.isLoading}
					{#each Array(2) as _}
						<div class="h-24 animate-pulse rounded-2xl bg-white/5 border border-white/5"></div>
					{/each}
				{:else if sessions.length === 0}
					<div class="text-center py-10 rounded-2xl border border-dashed border-white/10">
						<p class="text-slate-500 text-sm">No active sessions found.</p>
					</div>
				{:else}
					{#each sessions as session}
						{@const isCurrent = (session as any)?.current ?? session.isCurrent}
						<div class={cn(
							"relative flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 group",
							isCurrent
								? "border-green-500/30 bg-green-500/5 hover:border-green-500/40"
								: "border-white/5 bg-slate-950/30 hover:border-white/10 hover:bg-slate-950/50"
						)}>

							<!-- Content -->
							<div class="flex items-center gap-4 flex-1">
								<!-- Single unified Icon for all sessions -->
								<div class={cn(
									"flex h-12 w-12 items-center justify-center rounded-xl shadow-inner transition-all duration-300",
									isCurrent
										? "bg-green-500/10 text-green-500 border border-green-500/20"
										: "bg-slate-900 text-slate-500 border border-slate-800 group-hover:text-primary group-hover:bg-slate-800"
								)}>
									<Monitor size={20} strokeWidth={1.5} />
								</div>

								<!-- Session Info -->
								<div class="space-y-2 min-w-0">
									<!-- Title with Current Badge -->
									<div class="flex items-center gap-2 flex-wrap">
										<p class="text-xs font-bold uppercase tracking-tight text-slate-100">
											{session.browser} on {session.os}
										</p>
										{#if isCurrent}
											<span class="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-500 whitespace-nowrap">
												Your Device
											</span>
										{/if}
									</div>

									<!-- Metadata -->
									<div class="space-y-0.5">
										<p class="text-[10px] text-slate-400 font-medium">
											Signed in {formatSessionDate(session.issuedAt)}
										</p>
										<p class="text-[9px] text-slate-500 font-mono tracking-tighter">
											{session.ipAddress}
										</p>
									</div>
								</div>
							</div>

							<!-- Revoke Button -->
							{#if !isCurrent}
								<button 
									onclick={() => (showConfirmRevokeSingle = { tokenId: session.tokenId, title: 'Revoke session', message: 'Are you sure you want to revoke this session?' })}
									disabled={isRevokingSingleSession[session.tokenId]}
									title="Revoke this session"
									class="ml-4 p-2.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
								>
									{#if isRevokingSingleSession[session.tokenId]}
										<div class="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
									{:else}
										<LogOut size={18} strokeWidth={1.5} />
									{/if}
								</button>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Модальное окно для смены/установки пароля -->
{#if showPasswordModal}
    <PasswordModal 
        isOpen={showPasswordModal} 
        isPasswordSet={securityContext.status?.passwordSet || false} 
        onClose={() => (showPasswordModal = false)} 
    />
{/if}

{#if showOtpDisableModal}
	<OtpDisableModal
		isOpen={showOtpDisableModal}
		onClose={() => (showOtpDisableModal = false)}
		onDisabled={handleOtpDisabled}
	/>
{/if}

<!-- Confirm Dialogs -->
<ConfirmDialog
	isOpen={showConfirmRevokeAll}
	title="Revoke All Sessions"
	message="This will log you out from all other devices. Continue?"
	confirmLabel="Revoke All"
	destructive={true}
	onConfirm={handleLogoutAll}
	onClose={() => (showConfirmRevokeAll = false)}
/> 

{#if showConfirmRevokeSingle}
	{@const tokenId = showConfirmRevokeSingle.tokenId}
	<ConfirmDialog
		isOpen={true}
		title={showConfirmRevokeSingle.title}
		message={showConfirmRevokeSingle.message}
		confirmLabel="Revoke"
		destructive={true}
		onConfirm={() => handleRevokeSingleSession(tokenId)}
		onClose={() => (showConfirmRevokeSingle = null)}
	/>
{/if}