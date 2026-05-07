<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { ShieldCheck, ArrowLeft, Timer } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	
	import Button from '$lib/components/ui/Button.svelte';
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import type { OtpVerifyRequest } from '$lib/types/auth'; // Импортируем тип

	let loading = $state(false);
	let hasError = $state(false);
	let digits = $state(['', '', '', '', '', '']);
	let inputRefs = $state<HTMLInputElement[]>([]); // <-- inputRefs теперь реактивен
	
	let timeLeft = $state(300); // 5 минут в секундах
	let timerInterval: any;
    let mfaTempToken = $state<string | null>(null); // Переносим mfaTempToken в стейт

	function checkTokenValidity() {
		mfaTempToken = sessionStorage.getItem('mfa_temp_token');
		const timestamp = sessionStorage.getItem('mfa_token_timestamp');

		if (!mfaTempToken || !timestamp) return false;

		const elapsed = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
		if (elapsed >= 300) return false;

		timeLeft = 300 - elapsed;
		return true;
	}

	onMount(() => {
		if (!checkTokenValidity()) {
			toasts.show('MFA session expired. Please login again.', 'error');
			cleanupAndRedirect();
			return;
		}

		timerInterval = setInterval(() => {
			if (!checkTokenValidity()) {
				cleanupAndRedirect();
			}
		}, 1000);

		// Убеждаемся, что inputRefs существует перед попыткой фокуса
		$effect(() => {
			if (inputRefs[0]) {
				inputRefs[0].focus();
			}
		});
	});

	onDestroy(() => clearInterval(timerInterval));

	function cleanupAndRedirect() {
		clearInterval(timerInterval);
		sessionStorage.removeItem('mfa_temp_token');
		sessionStorage.removeItem('mfa_token_timestamp');
		goto('/auth');
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

	function handlePaste(e: ClipboardEvent) {
		const data = e.clipboardData?.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
		if (data) {
			data.split('').forEach((char, i) => { if (i < 6) digits[i] = char; });
			inputRefs[Math.min(data.length, 5)]?.focus(); // Проверка на null
		}
	}

	async function handleVerify() {
		const code = digits.join('');
		if (code.length < 6 || !mfaTempToken) {
			toasts.show('Please enter all 6 digits or session expired', 'error');
			return;
		}

		loading = true;
		try {
			// !!! ИСПРАВЛЕНИЕ ЗДЕСЬ !!!
			await authService.verifyOtp({ code, mfaTempToken }); // Передаем объект OtpVerifyRequest
			
			const user = await authService.fetchUserInfo();
			if (user) userContext.set(user);
			
			sessionStorage.removeItem('mfa_temp_token');
			sessionStorage.removeItem('mfa_token_timestamp');
			toasts.show('Welcome back!', 'success');
			goto('/');
		} catch (err: any) {
			hasError = true;
			digits = ['', '', '', '', '', ''];
			inputRefs[0]?.focus(); // Проверка на null
			toasts.show(err.message || 'Invalid code', 'error');
		} finally {
			loading = false;
		}
	}

	const timerDisplay = $derived(`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`);
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4 bg-background transition-all">
	<div class="w-full max-w-110 rounded-[2.5rem] border border-white/5 bg-surface p-8 sm:p-12 text-center shadow-2xl">
		
		<div class="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
			<ShieldCheck size={32} class="text-primary" />
		</div>
		
		<h2 class="text-2xl font-bold mb-2 text-white">Two-Factor Auth</h2>
		<p class="text-slate-500 text-sm mb-10 font-medium">
			Enter code from your 2FA-app
		</p>

		<form class="space-y-10" onsubmit={(e) => { e.preventDefault(); handleVerify(); }}>
			
			<div class="space-y-4">
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
									"w-full aspect-square max-w-[44px] sm:max-w-[48px] text-center text-xl font-bold rounded-xl border bg-input-bg transition-all focus:outline-none focus:ring-2",
									hasError 
										? "border-red-500/50 text-red-500 ring-red-500/10" 
										: "border-white/10 text-white focus:border-primary/50 focus:ring-primary/20"
								)}
							/>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest {timeLeft < 60 ? 'text-red-500' : 'text-slate-600'}">
					<Timer size={12} />
					Time remaining {timerDisplay}
				</div>
			</div>

			<div class="space-y-6">
				<Button type="submit" class="w-full py-4 text-base shadow-lg shadow-primary/20" isLoading={loading} disabled={digits.join('').length < 6}>
					Verify Code
				</Button>

				<button 
					type="button" 
					onclick={() => goto('/auth')}
					class="flex items-center justify-center gap-2 w-full text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
				>
					<ArrowLeft size={14} /> Back to Sign In
				</button>
			</div>
		</form>
	</div>
</div>