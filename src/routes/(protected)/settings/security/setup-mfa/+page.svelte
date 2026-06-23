<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Только goto
	import { ArrowLeft, Copy, Check } from 'lucide-svelte';
	import QRCode from 'qrcode';
	import { cn } from '$lib/utils/ui';

	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import { securityContext } from '$lib/runes/security.svelte';

	let loading = $state(false);
	let initializing = $state(true);
	let secretUri = $state('');
	let qrCodeUrl = $state('');
	let copied = $state(false);

	let digits = $state(['', '', '', '', '', '']);
	let inputRefs: HTMLInputElement[] = [];
	let hasError = $state(false);

	function isOtpAlreadyEnabledError(error: any) {
		const message = String(error?.message || error?.statusMessage || '').toLowerCase();
		return error?.status === 400 && (message.includes('already') || message.includes('enabled'));
	}

	async function goBackToSecurity() {
		await goto('/settings/security', { replaceState: true, noScroll: true });
	}

	onMount(async () => {
		if (!userContext.isAuthenticated) {
			goto('/auth');
			return;
		}

		try {
			const data = await authService.initMfaConnect();
			secretUri = data.secretUri;
			qrCodeUrl = await QRCode.toDataURL(secretUri, {
				margin: 1,
				width: 400,
				color: { dark: '#0f172a', light: '#ffffff' }
			});
		} catch (err: any) {
			if (isOtpAlreadyEnabledError(err)) {
				await goBackToSecurity();
				return;
			}

			toasts.show(err.message || 'Failed to initialize MFA', 'error');
			await goBackToSecurity();
		} finally {
			initializing = false;
		}
	});

	let rawSecret = $derived.by(() => {
		try {
			const url = new URL(secretUri);
			return url.searchParams.get('secret') || '';
		} catch {
			return '';
		}
	});

	function handleCopy() {
		navigator.clipboard.writeText(rawSecret);
		copied = true;
		setTimeout(() => (copied = false), 2000);
		toasts.show('Copied!', 'success');
	}

	function handleInput(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const val = input.value.slice(-1).replace(/[^0-9]/g, '');
		digits[index] = val;
		hasError = false;
		if (val && index < 5) inputRefs[index + 1].focus();
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			inputRefs[index - 1].focus();
		}
	}

	async function handleConfirm() {
		const code = digits.join('');
		if (code.length < 6) return;

		loading = true;
		try {
			await authService.confirmMfaConnect({ code });

			// Обновляем локальное состояние без вызова refreshStatus()
			// чтобы избежать race condition и повторного initMfaConnect
			if (securityContext.status) {
				securityContext.set({ ...securityContext.status, mfaEnabled: true });
			}

			toasts.show('MFA is now active!', 'success');

			// На settings/security (app)/+layout.svelte будет правильно загружать свежий статус
			await goBackToSecurity();
		} catch (err: any) {
			if (isOtpAlreadyEnabledError(err)) {
				toasts.show('MFA is already enabled', 'success');
				await goBackToSecurity();
				return;
			}

			hasError = true;
			digits = ['', '', '', '', '', ''];
			inputRefs[0].focus();
			toasts.show(err.message || 'Verification failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-md pb-12 duration-500">
	<div class="rounded-4xl border border-white/5 bg-surface p-8 shadow-2xl">
		<!-- rounded-4xl -->

		<div class="mb-8 flex items-center justify-between">
			<button
				onclick={() => goto('/settings/security')}
				class="-ml-2 p-2 text-slate-500 transition-colors hover:text-white"
			>
				<ArrowLeft size={20} />
			</button>
			<h2 class="text-sm font-bold tracking-[0.2em] text-white uppercase">Security Step-up</h2>
			<div class="w-8"></div>
		</div>

		{#if initializing}
			<div class="animate-pulse space-y-8">
				<div class="text-center">
					<div class="mx-auto mb-6 h-44 w-44 rounded-2xl bg-white/5 sm:h-52 sm:w-52"></div>
					<div class="mx-auto h-5 w-40 rounded-full bg-white/5"></div>
					<div class="mx-auto mt-3 h-3 w-64 max-w-full rounded-full bg-white/5"></div>
				</div>

				<div class="rounded-2xl border border-white/5 bg-slate-950/50 p-4">
					<div class="flex items-center justify-between gap-4">
						<div class="min-w-0 flex-1 space-y-2">
							<div class="h-3 w-24 rounded-full bg-white/5"></div>
							<div class="h-3 w-full rounded-full bg-white/5"></div>
						</div>
						<div class="h-10 w-10 rounded-xl bg-white/5"></div>
					</div>
				</div>

				<div class="border-t border-white/5 pt-2">
					<div class="mx-auto mb-6 h-3 w-44 rounded-full bg-white/5"></div>
					<div class="mx-auto grid max-w-[320px] grid-cols-6 gap-2 sm:gap-3">
						{#each Array(6) as _}
							<div class="aspect-square rounded-xl border border-white/10 bg-white/5"></div>
						{/each}
					</div>
					<div class="mt-8 h-14 rounded-xl bg-white/5"></div>
				</div>
			</div>
		{:else}
			<div class="space-y-8">
				<!-- Step 1: QR Code -->
				<div class="text-center">
					<div class="mb-6 inline-block rounded-2xl bg-white p-3 shadow-2xl shadow-primary/5">
						<img src={qrCodeUrl} alt="QR" class="h-40 w-40 sm:h-48 sm:w-48" />
					</div>
					<h3 class="mb-2 text-lg font-bold text-white">Scan with App</h3>
					<p class="px-4 text-xs text-slate-500">
						Open your authenticator app and scan this code to link your account.
					</p>
				</div>

				<!-- Step 2: Manual Key (Fallback) -->
				<div
					class="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 p-4"
				>
					<div class="mr-4 overflow-hidden text-left">
						<p class="mb-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase">
							Manual Key
						</p>
						<p class="truncate font-mono text-xs tracking-tight text-slate-300">{rawSecret}</p>
					</div>
					<button
						onclick={handleCopy}
						class="shrink-0 rounded-xl bg-white/5 p-2.5 text-slate-400 transition-all hover:bg-white/10 hover:text-primary"
					>
						{#if copied}
							<Check size={16} />
						{:else}
							<Copy size={16} />
						{/if}
					</button>
				</div>

				<!-- Step 3: Verify -->
				<div class="border-t border-white/5 pt-6">
					<p
						class="mb-6 text-center text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase"
					>
						Enter Code from APP
					</p>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						class="space-y-8"
					>
						<div class="flex justify-center">
							<div class="grid max-w-[320px] grid-cols-6 gap-2 sm:gap-3">
								{#each digits as digit, i}
									<input
										type="text"
										inputmode="numeric"
										bind:this={inputRefs[i]}
										value={digit}
										oninput={(e) => handleInput(e, i)}
										onkeydown={(e) => handleKeyDown(e, i)}
										class={cn(
											'aspect-square w-full max-w-11 rounded-xl border bg-input-bg text-center text-xl font-bold transition-all focus:ring-2 focus:outline-none sm:max-w-12',
											hasError
												? 'border-red-500/50 text-red-500 ring-red-500/10'
												: 'border-white/10 text-white focus:border-primary/50 focus:ring-primary/20'
										)}
									/>
								{/each}
							</div>
						</div>

						<Button
							type="submit"
							class="w-full py-4 text-sm tracking-widest uppercase shadow-lg shadow-primary/10"
							isLoading={loading}
							disabled={digits.join('').length < 6}
						>
							Activate
						</Button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
