<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores'; // Правильный импорт для page
	import { Lock, CheckCircle2, Save } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { authService } from '$lib/api/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let resetToken = $state<string | null>(null);
	let resetSuccess = $state(false);

	onMount(() => {
		resetToken = $page.url.searchParams.get('token');
		if (!resetToken) {
			toasts.show('Invalid or missing reset token', 'error');
			goto('/auth/recovery'); // Редирект, если нет токена
		}
	});

	let passwordMismatch = $derived(confirmPassword.length > 0 && newPassword !== confirmPassword);

	function validateForm(): boolean {
		fieldErrors = {};
		let isValid = true;
		if (newPassword.length < 6) {
			fieldErrors.newPassword = 'Password must be at least 6 characters';
			isValid = false;
		}
		if (passwordMismatch) {
			fieldErrors.confirmPassword = 'Passwords do not match';
			isValid = false;
		}
		if (!isValid) toasts.show('Please fix the errors in the form', 'error');
		return isValid;
	}

	async function handleResetPassword() {
		if (!validateForm() || !resetToken) return;

		loading = true;
		try {
			await authService.resetPassword({ resetToken, newPassword });
			resetSuccess = true;
			toasts.show('Your password has been reset successfully!', 'success');
		} catch (e: any) {
			if (e.fieldErrors) fieldErrors = e.fieldErrors;
			toasts.show(e.message || 'Failed to reset password. Token might be expired.', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
	<div
		class="w-full max-w-110 rounded-4xl border border-white/5 bg-surface p-8 text-center shadow-2xl sm:p-10"
	>
		{#if resetSuccess}
			<div class="space-y-4 py-10 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-500 shadow-inner"
				>
					<CheckCircle2 size={32} />
				</div>
				<h2 class="text-2xl font-bold text-white">Password Reset!</h2>
				<p class="mx-auto max-w-sm text-sm text-slate-500">
					Your password has been successfully updated. You can now log in with your new password.
				</p>
				<Button onclick={() => goto('/auth')} class="mx-auto mt-8 px-8">Go to Sign In</Button>
			</div>
		{:else}
			<h2 class="mb-2 text-2xl font-bold text-white">Set New Password</h2>
			<p class="mx-auto mb-8 max-w-sm text-sm font-medium text-slate-500">
				Enter your new password below. Make sure it's strong and unique.
			</p>

			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleResetPassword();
				}}
			>
				<Input
					bind:value={newPassword}
					type="password"
					label="New Password"
					placeholder="••••••••"
					icon={Lock}
					error={fieldErrors.newPassword}
				/>
				<Input
					bind:value={confirmPassword}
					type="password"
					label="Confirm New Password"
					placeholder="••••••••"
					icon={Lock}
					error={fieldErrors.confirmPassword ||
						(passwordMismatch ? 'Passwords do not match' : null)}
				/>
				<Button type="submit" class="w-full py-4 text-base" isLoading={loading}>
					Reset Password
				</Button>
			</form>
		{/if}
	</div>
</div>
