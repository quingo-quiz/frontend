<script lang="ts">
	import { AlertCircle, Mail, RefreshCw } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { securityContext } from '$lib/runes/security.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import { toasts } from '$lib/runes/toast.svelte';

	let isSending = $state(false);

	let shouldShowBanner = $derived(
		userContext.isAuthenticated &&
		!!securityContext.status &&
		!securityContext.status.emailVerified
	);

	async function handleResendVerification() {
		if (!securityContext.status?.email || isSending) return;

		isSending = true;
		try {
			await authService.resendEmailVerification();
			toasts.show(`Verification email sent to ${securityContext.status.email}`, 'success');
		} catch (e: any) {
			toasts.show(e.message || 'Failed to resend verification email', 'error');
		} finally {
			isSending = false;
		}
	}
</script>

{#if shouldShowBanner && securityContext.status}
	<section class="sticky top-16 z-40 border-b border-amber-500/20 bg-amber-500/10 backdrop-blur-md">
		<div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
					<AlertCircle size={18} />
				</div>
				<div class="space-y-1">
					<p class="text-sm font-semibold text-amber-50">Email not verified</p>
					<p class="text-xs leading-relaxed text-amber-50/75">
						We sent a verification link to {securityContext.status.email}. Confirm it to unlock full account access.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3 lg:shrink-0">
				<div class="hidden items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-50/80 sm:flex">
					<Mail size={14} />
					<span>{securityContext.status.email}</span>
				</div>
				<Button
					variant="secondary"
					isLoading={isSending}
					onclick={handleResendVerification}
					class="border-amber-400/20 bg-amber-500/10 text-amber-50 hover:bg-amber-500/20"
				>
					<RefreshCw size={16} />
					Resend verification email
				</Button>
			</div>
		</div>
	</section>
{/if}