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

	let rawSecret = $derived(() => {
		try {
			const url = new URL(secretUri);
			return url.searchParams.get('secret') || '';
		} catch { return ''; }
	});

	function handleCopy() {
		navigator.clipboard.writeText(rawSecret());
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

<div class="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
	<div class="bg-surface border border-white/5 rounded-4xl p-8 shadow-2xl"> <!-- rounded-4xl -->
		
		<div class="flex items-center justify-between mb-8">
			<button onclick={() => goto('/settings/security')} class="p-2 -ml-2 text-slate-500 hover:text-white transition-colors">
				<ArrowLeft size={20} />
			</button>
			<h2 class="text-sm font-bold text-white uppercase tracking-[0.2em]">Security Step-up</h2>
			<div class="w-8"></div>
		</div>

		{#if initializing}
			<div class="space-y-8 animate-pulse">
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

				<div class="pt-2 border-t border-white/5">
					<div class="mb-6 h-3 w-44 rounded-full bg-white/5 mx-auto"></div>
					<div class="grid grid-cols-6 gap-2 sm:gap-3 max-w-[320px] mx-auto">
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
					<div class="bg-white p-3 rounded-2xl inline-block shadow-2xl shadow-primary/5 mb-6">
						<img src={qrCodeUrl} alt="QR" class="w-40 h-40 sm:w-48 sm:h-48" />
					</div>
					<h3 class="text-white font-bold text-lg mb-2">Scan with App</h3>
					<p class="text-slate-500 text-xs px-4">
						Open your authenticator app and scan this code to link your account.
					</p>
				</div>

				<!-- Step 2: Manual Key (Fallback) -->
				<div class="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
					<div class="text-left overflow-hidden mr-4">
						<p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Manual Key</p>
						<p class="text-xs font-mono text-slate-300 truncate tracking-tight">{rawSecret()}</p>
					</div>
					<button onclick={handleCopy} class="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-primary hover:bg-white/10 transition-all shrink-0">
						{#if copied} <Check size={16} /> {:else} <Copy size={16} /> {/if}
					</button>
				</div>

				<!-- Step 3: Verify -->
				<div class="pt-6 border-t border-white/5">
					<p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center mb-6">Enter Code from APP</p>
					
					<form onsubmit={(e) => { e.preventDefault(); handleConfirm(); }} class="space-y-8">
						<div class="flex justify-center">
							<div class="grid grid-cols-6 gap-2 sm:gap-3 max-w-[320px]">
								{#each digits as digit, i}
									<input
										type="text"
										inputmode="numeric"
										bind:this={inputRefs[i]}
										value={digit}
										oninput={(e) => handleInput(e, i)}
										onkeydown={(e) => handleKeyDown(e, i)}
										class={cn(
											"w-full aspect-square max-w-11 sm:max-w-12 text-center text-xl font-bold rounded-xl border bg-input-bg transition-all focus:outline-none focus:ring-2",
											hasError 
												? "border-red-500/50 text-red-500 ring-red-500/10" 
												: "border-white/10 text-white focus:border-primary/50 focus:ring-primary/20"
										)}
									/>
								{/each}
							</div>
						</div>

						<Button type="submit" class="w-full py-4 text-sm uppercase tracking-widest shadow-lg shadow-primary/10" isLoading={loading} disabled={digits.join('').length < 6}>
							Activate
						</Button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>