<script lang="ts">
	import { ShieldOff, X, AlertTriangle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';
	import { cn } from '$lib/utils/ui';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onDisabled: () => Promise<void> | void;
	}

	let { isOpen, onClose, onDisabled }: Props = $props();

	let codeDigits = $state(['', '', '', '', '', '']);
	let inputRefs: HTMLInputElement[] = [];
	let isLoading = $state(false);
	let fieldError = $state('');

	$effect(() => {
		if (!isOpen) {
			codeDigits = ['', '', '', '', '', ''];
			fieldError = '';
			isLoading = false;
			return;
		}

		queueMicrotask(() => inputRefs[0]?.focus());
	});

	function handleInput(event: Event, index: number) {
		const input = event.target as HTMLInputElement;
		const value = input.value.slice(-1).replace(/[^0-9]/g, '');

		codeDigits[index] = value;
		fieldError = '';

		if (value && index < 5) {
			inputRefs[index + 1]?.focus();
		}
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
			inputRefs[index - 1]?.focus();
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();

		const pastedDigits = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? '';
		if (!pastedDigits) return;

		codeDigits = pastedDigits.split('').concat(Array(6 - pastedDigits.length).fill(''));
		const nextIndex = Math.min(pastedDigits.length, 5);
		inputRefs[nextIndex]?.focus();
	}

	async function handleDisable() {
		if (isLoading) return;

		const code = codeDigits.join('');
		if (code.length < 6) {
			fieldError = 'Enter the 6-digit authentication code';
			return;
		}

		isLoading = true;
		fieldError = '';

		try {
			await authService.disableMfa({ code });
			toasts.show('OTP 2FA has been disabled', 'success');
			await onDisabled();
			onClose();
		} catch (e: any) {
			fieldError = e.fieldErrors?.code || e.message || 'Failed to disable 2FA';
			toasts.show(fieldError, 'error');
		} finally {
			isLoading = false;
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={onClose}
		onkeydown={(event) => { if (event.key === 'Escape') onClose(); }}
	>
		<div
			class="w-full max-w-md rounded-[2.5rem] border border-white/5 bg-surface p-8 shadow-2xl"
			role="presentation"
			onclick={(event) => event.stopPropagation()}
		>
			<div class="mb-6 flex items-start justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
						<ShieldOff size={20} />
					</div>
					<div>
						<h3 class="text-xl font-bold text-white">Disable OTP 2FA</h3>
					</div>
				</div>

				<button
					onclick={onClose}
					class="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
					aria-label="Close dialog"
				>
					<X size={20} />
				</button>
			</div>

			<p class="mb-7 text-sm leading-relaxed text-slate-400">
				Enter the current code from your authenticator app to turn off OTP protection.
			</p>

			<form class="space-y-7" onsubmit={(event) => { event.preventDefault(); handleDisable(); }}>
				<div class="space-y-3">
					<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center">Authenticator code</p>
					<div class="flex justify-center">
						<div class="grid grid-cols-6 gap-2 sm:gap-3 max-w-[320px]">
							{#each codeDigits as digit, index}
								<input
									type="text"
									inputmode="numeric"
									maxlength="1"
									bind:this={inputRefs[index]}
									value={digit}
									oninput={(event) => handleInput(event, index)}
									onkeydown={(event) => handleKeyDown(event, index)}
									onpaste={handlePaste}
									class={cn(
										"w-full aspect-square max-w-11 sm:max-w-12 text-center text-xl font-bold rounded-xl border bg-input-bg transition-all focus:outline-none focus:ring-2",
										fieldError
											? 'border-red-500/50 text-red-500 ring-red-500/10'
											: 'border-white/10 text-white focus:border-primary/50 focus:ring-primary/20'
									)}
								/>
							{/each}
						</div>
					</div>
					{#if fieldError}
						<div class="flex items-center justify-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-sm text-red-300">
							<AlertTriangle size={16} />
							<span>{fieldError}</span>
						</div>
					{/if}
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<Button type="button" variant="secondary" onclick={onClose} class="w-full">
						Cancel
					</Button>
					<Button type="submit" isLoading={isLoading} class="w-full bg-red-500 text-white hover:bg-red-500/90">
						Disable OTP
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
