<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Только goto
	import { page } from '$app/stores'; // Правильный импорт для page
	import { CheckCircle2, AlertCircle, Mail } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { authService } from '$lib/api/auth';
	import { userContext } from '$lib/runes/user.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let verificationStatus = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');

	onMount(async () => {
		const verificationToken = $page.url.searchParams.get('token');

		if (!verificationToken) {
			verificationStatus = 'error';
			errorMessage = 'Verification link is invalid or missing.';
			toasts.show(errorMessage, 'error');
			return;
		}

		try {
			// Вызов verifyEmail теперь НЕ использует authorizedFetch
			await authService.verifyEmail({ verificationToken });

			// После успешной верификации email, пользователь может быть уже залогинен.
			// Пытаемся обновить его данные. authorizedFetch здесь корректен,
			// т.к. если сессии нет, он вернет null, не вызывая редиректа.
			const freshUser = await authService.fetchUserInfo();
			userContext.set(freshUser); // Обновит state, mfaEnabled, emailVerified

			verificationStatus = 'success';
			toasts.show('Your email has been successfully verified!', 'success');
		} catch (e: any) {
			verificationStatus = 'error';
			errorMessage =
				e.message || 'Failed to verify email. The link might be expired or already used.';
			toasts.show(errorMessage, 'error');
		}
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
	<div
		class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 text-center shadow-2xl sm:p-10"
	>
		{#if verificationStatus === 'loading'}
			<div class="flex flex-col items-center gap-4 py-10 text-slate-500">
				<div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
				<span class="text-lg font-bold">Verifying Email...</span>
				<p class="text-sm">Please wait, this may take a moment.</p>
			</div>
		{:else if verificationStatus === 'success'}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-500 shadow-inner"
				>
					<CheckCircle2 size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Email Verified!</h2>
				<p class="mx-auto max-w-sm text-sm text-slate-500">
					Thank you for verifying your email address. Your account is now fully active.
				</p>
				<Button onclick={() => goto('/')} class="mx-auto mt-8 px-8">Continue to App</Button>
			</div>
		{:else}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-inner"
				>
					<AlertCircle size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Verification Failed</h2>
				<p class="mx-auto max-w-sm text-sm text-red-400">
					{errorMessage}
				</p>
				<Button onclick={() => goto('/auth')} class="mx-auto mt-8 px-8">Return to Sign In</Button>
			</div>
		{/if}
	</div>
</div>
