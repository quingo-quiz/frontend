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
			errorMessage = e.message || 'Failed to verify email. The link might be expired or already used.';
			toasts.show(errorMessage, 'error');
		}
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4 bg-background">
	<div class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 sm:p-10 text-center shadow-2xl">
		
		{#if verificationStatus === 'loading'}
			<div class="py-10 flex flex-col items-center gap-4 text-slate-500">
				<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
				<span class="text-lg font-bold">Verifying Email...</span>
				<p class="text-sm">Please wait, this may take a moment.</p>
			</div>
		{:else if verificationStatus === 'success'}
			<div class="py-10 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-inner">
					<CheckCircle2 size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Email Verified!</h2>
				<p class="text-slate-500 text-sm max-w-sm mx-auto">
					Thank you for verifying your email address. Your account is now fully active.
				</p>
				<Button onclick={() => goto('/')} class="mt-8 mx-auto px-8">Continue to App</Button>
			</div>
		{:else}
			<div class="py-10 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
					<AlertCircle size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Verification Failed</h2>
				<p class="text-red-400 text-sm max-w-sm mx-auto">
					{errorMessage}
				</p>
				<Button onclick={() => goto('/auth')} class="mt-8 mx-auto px-8">Return to Sign In</Button>
			</div>
		{/if}
	</div>
</div>