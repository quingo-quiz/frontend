<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import { securityContext } from '$lib/runes/security.svelte';
	import { goto } from '$app/navigation';
	import { Mail } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';

	let isResendingVerification = $state(false);

	$effect(() => {
		if (!userContext.isLoading && !userContext.isAuthenticated) {
			goto('/auth');
		}
	});

	async function handleResendVerification() {
		if (!securityContext.status || securityContext.status.emailVerified || isResendingVerification) return;

		isResendingVerification = true;
		try {
			await authService.resendEmailVerification();
			toasts.show(`Verification email sent to ${securityContext.status.email}`, 'success');
		} catch (e: any) {
			toasts.show(e.message || 'Failed to resend verification email', 'error');
		} finally {
			isResendingVerification = false;
		}
	}
</script>

{#if userContext.isLoading || securityContext.isLoading}
	<div class="flex justify-center py-20">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else if userContext.user && securityContext.status}
	<div class="max-w-4xl mx-auto space-y-6">
		<div class="rounded-4xl border border-white/5 bg-surface p-6 sm:p-10 shadow-2xl relative overflow-hidden">
			<div class="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full"></div>

			<div class="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
				<div class="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center text-white text-5xl font-bold shadow-2xl shadow-primary/30">
					{userContext.user.username.charAt(0).toUpperCase()}
				</div>

				<div class="grow space-y-3">
					<div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
						<h1 class="text-3xl font-bold">{userContext.user.username}</h1>
						{#each userContext.user.roles as role}
							<span class="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20">
								{role}
							</span>
						{/each}
					</div>
					<p class="text-slate-400 flex items-center justify-center md:justify-start gap-2 text-sm">
						<Mail size={16} /> {userContext.user.email}
					</p>
				</div>

				<a href="/settings" class="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-xs border border-white/10 uppercase tracking-wider">
					Settings
				</a>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-surface border border-white/5 p-5 rounded-2xl">
				<p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Account Status</p>
				<p class="text-lg font-bold text-green-400">{userContext.user.accountStatus}</p>
			</div>
			<div class="bg-surface border border-white/5 p-5 rounded-2xl">
				<p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">2FA Security</p>
				<p class="text-lg font-bold {securityContext.status.mfaEnabled ? 'text-primary' : 'text-slate-500'}">
					{securityContext.status.mfaEnabled ? 'Protected' : 'Disabled'}
				</p>
			</div>
			<!-- Обновленная плашка Email Status -->
			<div class="bg-surface border border-white/5 p-5 rounded-2xl">
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Email Status</p>
                {#if securityContext.status.emailVerified}
                    <p class="text-lg font-bold text-green-400">Verified</p>
                {:else}
                    <p class="text-lg font-bold text-orange-400 mb-2">Verification Required</p>
					<p class="text-xs text-slate-400 mb-4 leading-relaxed">
					</p>
					<Button
						variant="secondary"
						isLoading={isResendingVerification}
						onclick={handleResendVerification}
						class="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase tracking-widest"
					>
						Resend email
					</Button>
                {/if}
            </div>
		</div>
	</div>
{:else}
    <div class="text-center py-20">
        <p class="text-xl text-red-500">Failed to load profile data.</p>
        <Button onclick={() => goto('/auth')} class="mt-4">Go to Login</Button>
    </div>
{/if}