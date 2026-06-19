<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import { goto } from '$app/navigation';
	import { Mail, AlertCircle, BadgeCheck, Settings as SettingsIcon, Pencil, RefreshCw } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';

	let isResendingVerification = $state(false);

	$effect(() => {
		if (!userContext.isLoading && !userContext.isAuthenticated) {
			goto('/auth');
		}
	});

	async function handleResendVerification() {
		if (isResendingVerification) return;
		isResendingVerification = true;
		try {
			await authService.resendEmailVerification();
			toasts.show(`Verification email sent to ${userContext.user?.email}`, 'success');
		} catch (e: any) {
			toasts.show(e.message || 'Failed to resend verification email', 'error');
		} finally {
			isResendingVerification = false;
		}
	}
</script>

<svelte:head><title>Profile · Quingo</title></svelte:head>

{#if userContext.isLoading}
	<div class="flex justify-center py-20">
		<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
	</div>
{:else if userContext.user}
	{@const user = userContext.user}
	<div class="mx-auto max-w-3xl">
		<div class="rounded-[2.5rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
			<!-- Шапка: аватар + имя + действие -->
			<div class="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
				<div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-primary text-4xl font-bold text-white shadow-2xl shadow-primary/30 sm:h-28 sm:w-28 sm:text-5xl">
					{user.username.charAt(0).toUpperCase()}
				</div>

				<div class="min-w-0 grow space-y-2">
					<div class="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
						<h1 class="text-3xl font-bold tracking-tight text-white">{user.username}</h1>
						{#each user.roles as role}
							<span class="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
								{role}
							</span>
						{/each}
					</div>

					<!-- Email + индикатор подтверждения (статус не отдельным блоком, а тултипом) -->
					<div class="flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
						<Mail size={16} class="shrink-0" />
						<span class="truncate">{user.email}</span>
						{#if user.emailVerified}
							<Tooltip content="Email verified">
								<BadgeCheck size={16} class="text-green-400" />
							</Tooltip>
						{:else}
							<Tooltip width="w-60">
								<AlertCircle size={16} class="text-amber-400" />
								{#snippet panel()}
									<p class="font-semibold text-amber-300">Email not verified</p>
									<p class="mt-1 text-slate-400">Confirm your email to unlock full account access.</p>
									<button
										type="button"
										onclick={handleResendVerification}
										disabled={isResendingVerification}
										class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
									>
										<RefreshCw size={13} class={isResendingVerification ? 'animate-spin' : ''} />
										Resend verification
									</button>
								{/snippet}
							</Tooltip>
						{/if}
					</div>
				</div>

				<!-- Settings: на десктопе справа в шапке -->
				<a
					href="/settings"
					class="hidden shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:bg-white/10 hover:text-white sm:inline-flex"
				>
					<SettingsIcon size={15} /> Settings
				</a>
			</div>

			<!-- О себе -->
			<div class="mt-8 border-t border-white/5 pt-6">
				<p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">About</p>
				{#if user.bio}
					<p class="max-w-2xl text-sm leading-relaxed text-slate-300">{user.bio}</p>
				{:else}
					<p class="flex items-center gap-2 text-sm italic text-slate-600">
						<Pencil size={14} />
						No bio yet. Add one in <a href="/settings" class="font-semibold not-italic text-primary hover:underline">Settings</a>.
					</p>
				{/if}
			</div>

			<!-- Settings: на мобилке отдельной кнопкой внизу -->
			<a
				href="/settings"
				class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:bg-white/10 hover:text-white sm:hidden"
			>
				<SettingsIcon size={15} /> Settings
			</a>
		</div>
	</div>
{:else}
	<div class="py-20 text-center">
		<p class="text-xl text-red-500">Failed to load profile data.</p>
		<Button onclick={() => goto('/auth')} class="mt-4">Go to Login</Button>
	</div>
{/if}
