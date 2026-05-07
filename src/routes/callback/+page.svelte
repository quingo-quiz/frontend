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

<div class="flex min-h-dvh flex-col items-center justify-center p-4 bg-background"> <!-- min-h-dvh -->
	<div class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 sm:p-10 text-center shadow-2xl"> <!-- max-w-110, rounded-4xl -->
		{#if callbackStatus === 'loading'}
			<div class="py-10 flex flex-col items-center gap-4 text-slate-500">
				<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
				<span class="text-lg font-bold">Processing Login...</span>
				<p class="text-sm">Please wait, redirecting you shortly.</p>
			</div>
		{:else if callbackStatus === 'SUCCESS'}
			<div class="py-10 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-inner">
					<CheckCircle2 size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Success!</h2>
				<p class="text-slate-500 text-sm max-w-sm mx-auto">{callbackMessage}</p>
				<Button onclick={() => goto('/')} class="mt-8 mx-auto px-8">Go to App</Button>
			</div>
		{:else}
			<div class="py-10 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
					<AlertCircle size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Login Failed</h2>
				<p class="text-red-400 text-sm max-w-sm mx-auto">{callbackMessage}</p>
				<Button onclick={() => goto('/auth')} class="mt-8 mx-auto px-8">Try Again</Button>
			</div>
		{/if}
	</div>
</div>