<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Только goto
	import { page } from '$app/stores'; // <-- Правильный импорт для page
	import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import { authService } from '$lib/api/auth';
	import type { OAuth2CallbackResult, OAuth2CallbackStatus } from '$lib/types/auth';
	// Импорт Button (если он используется для Go to App / Try Again)
	import Button from '$lib/components/ui/Button.svelte';

	let callbackStatus = $state<'loading' | OAuth2CallbackStatus>('loading');
	let callbackMessage = $state('');
	let callbackCode = $state('');

	onMount(async () => {
		const statusParam = $page.url.searchParams.get('status');
		const messageParam = $page.url.searchParams.get('message');
		const codeParam = $page.url.searchParams.get('code');

		if (statusParam === 'SUCCESS') {
			callbackStatus = 'SUCCESS';
			callbackMessage = messageParam || 'Login successful!';
			callbackCode = codeParam || 'OAUTH2_SUCCESS';

			const user = await authService.fetchUserInfo();
			if (user) userContext.set(user);

			toasts.show(callbackMessage, 'success');
			goto('/');
		} else if (statusParam === 'ERROR') {
			callbackStatus = 'ERROR';
			callbackMessage = messageParam || 'OAuth2 login failed.';
			callbackCode = codeParam || 'OAUTH2_FAILED';
			toasts.show(callbackMessage, 'error');
			goto('/auth');
		} else {
			callbackStatus = 'ERROR';
			callbackMessage = 'Invalid OAuth2 callback state.';
			toasts.show(callbackMessage, 'error');
			goto('/auth');
		}
	});
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
	<!-- min-h-dvh -->
	<div
		class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 text-center shadow-2xl sm:p-10"
	>
		<!-- max-w-110, rounded-4xl -->
		{#if callbackStatus === 'loading'}
			<div class="flex flex-col items-center gap-4 py-10 text-slate-500">
				<div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
				<span class="text-lg font-bold">Processing Login...</span>
				<p class="text-sm">Please wait, redirecting you shortly.</p>
			</div>
		{:else if callbackStatus === 'SUCCESS'}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-500 shadow-inner"
				>
					<CheckCircle2 size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Success!</h2>
				<p class="mx-auto max-w-sm text-sm text-slate-500">{callbackMessage}</p>
				<Button onclick={() => goto('/')} class="mx-auto mt-8 px-8">Go to App</Button>
			</div>
		{:else}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-inner"
				>
					<AlertCircle size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Login Failed</h2>
				<p class="mx-auto max-w-sm text-sm text-red-400">{callbackMessage}</p>
				<Button onclick={() => goto('/auth')} class="mx-auto mt-8 px-8">Try Again</Button>
			</div>
		{/if}
	</div>
</div>
