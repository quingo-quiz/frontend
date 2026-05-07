<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { Mail, ChevronLeft, Send } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { authService } from '$lib/api/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let loading = $state(false);
	let emailSent = $state(false);
	let fieldErrors = $state<Record<string, string>>({});

	async function handleSendResetLink() {
		fieldErrors = {}; // Clear previous errors
		if (!email.includes('@')) {
			fieldErrors.email = 'Please enter a valid email address';
			return;
		}

		loading = true;
		try {
			await authService.sendPasswordResetLink({ email });
			emailSent = true;
			toasts.show('Password reset link sent to your email!', 'success');
		} catch (e: any) {
			if (e.fieldErrors) fieldErrors = e.fieldErrors;
			toasts.show(e.message || 'Failed to send reset link', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4 bg-background"> <!-- min-h-dvh -->
	<div class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 sm:p-10 text-center shadow-2xl"> <!-- max-w-110, rounded-4xl -->
		<a href="/auth" class="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 text-sm font-medium w-fit mx-auto">
			<ChevronLeft size={16} /> Back to Sign In
		</a>
		
		{#if !emailSent}
			<h2 class="text-2xl font-bold mb-2 text-white">Forgot Password?</h2>
			<p class="text-slate-500 text-sm mb-8 font-medium max-w-sm mx-auto">
				Enter your email and we'll send you a link to reset your password.
			</p>

			<form class="space-y-6" onsubmit={(e) => { e.preventDefault(); handleSendResetLink(); }}>
				<Input bind:value={email} label="Email Address" placeholder="you@example.com" icon={Mail} error={fieldErrors.email} />
				<Button type="submit" class="w-full py-4 text-base" isLoading={loading}>
					Send Reset Link <Send size={18} class="ml-2" />
				</Button>
			</form>
		{:else}
			<div class="py-10 text-center space-y-4">
				<div class="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-inner">
					<Mail size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Check Your Email</h2>
				<p class="text-slate-500 text-sm max-w-sm mx-auto">
					We've sent a password reset link to <span class="text-primary font-bold">{email}</span>. Please check your inbox.
				</p>
				<Button variant="secondary" onclick={() => goto('/auth')} class="mt-8 mx-auto px-8">Return to Sign In</Button>
			</div>
		{/if}
	</div>
</div>