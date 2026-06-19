<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { Mail, ChevronLeft } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { authService } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';

	let email = $state('');
	let loading = $state(false);
	let emailSent = $state(false);
	let fieldErrors = $state<Record<string, string>>({});

	// Подставляем email, введённый ранее на форме входа/регистрации
	onMount(() => {
		email = localStorage.getItem('auth_email') || '';
	});

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

<svelte:head><title>Password Recovery · Quingo</title></svelte:head>

<div class="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
	<!-- min-h-dvh -->
	<a href="/auth" class="mb-8 flex items-center gap-2.5">
		<img src={favicon} alt="Quingo" class="h-8 w-8" />
		<span class="text-2xl font-bold tracking-tight text-white italic">Quingo</span>
	</a>
	<div
		class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 text-center shadow-2xl sm:p-10"
	>
		<!-- max-w-110, rounded-4xl -->
		<a
			href="/auth"
			class="mx-auto mb-8 flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
		>
			<ChevronLeft size={16} /> Back to Sign In
		</a>

		{#if !emailSent}
			<h2 class="mb-2 text-2xl font-bold text-white">Forgot Password?</h2>
			<p class="mx-auto mb-8 max-w-sm text-sm font-medium text-slate-500">
				Enter your email and we'll send you recovery instructions.
			</p>

			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleSendResetLink();
				}}
			>
				<Input
					bind:value={email}
					label="Email Address"
					placeholder="you@example.com"
					icon={Mail}
					error={fieldErrors.email}
				/>
				<Button type="submit" class="w-full py-4 text-base" isLoading={loading}>Send</Button>
			</form>
		{:else}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-500 shadow-inner"
				>
					<Mail size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Check Your Email</h2>
				<p class="mx-auto max-w-sm text-sm text-slate-500">
					We've sent a password reset link to <span class="font-bold text-primary">{email}</span>.
					Please check your inbox.
				</p>
				<Button variant="secondary" onclick={() => goto('/auth')} class="mx-auto mt-8 px-8"
					>Return to Sign In</Button
				>
			</div>
		{/if}
	</div>
</div>
