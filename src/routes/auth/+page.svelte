<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { Mail, Lock, ArrowRight, User, CheckCircle2 } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';
	
	import { authService } from '$lib/api/auth';
	import { toasts } from '$lib/runes/toast.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let activeTab = $state<'signin' | 'create'>('signin');
	let loading = $state(false);
	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	// --- Persistence (Sticky Forms) ---
	onMount(() => {
		const savedTab = localStorage.getItem('auth_active_tab');
		if (savedTab === 'signin' || savedTab === 'create') activeTab = savedTab;
		email = localStorage.getItem('auth_email') || '';
		username = localStorage.getItem('auth_username') || '';
	});

	$effect(() => {
		localStorage.setItem('auth_active_tab', activeTab);
		localStorage.setItem('auth_email', email);
		localStorage.setItem('auth_username', username);
	});

	// --- Validation ---
	let passwordMismatch = $derived(activeTab === 'create' && confirmPassword.length > 0 && password !== confirmPassword);

	function validateForm(): boolean {
		fieldErrors = {};
		let isValid = true;
		if (!email.includes('@')) { fieldErrors.email = 'Invalid email address'; isValid = false; }
		if (password.length < 6) { fieldErrors.password = 'Min 6 characters required'; isValid = false; }
		if (activeTab === 'create') {
			if (username.length < 3) { fieldErrors.username = 'Username too short'; isValid = false; }
			if (password !== confirmPassword) { fieldErrors.confirmPassword = 'Passwords do not match'; isValid = false; }
		}
		if (!isValid) toasts.show('Please fix the errors in the form', 'error');
		return isValid;
	}

	async function completeAuthentication() {
		const user = await authService.fetchUserInfo();
		if (user) {
			userContext.set(user);
			localStorage.removeItem('auth_email');
			localStorage.removeItem('auth_username');
			toasts.show('Authentication successful!', 'success');
			goto('/');
		} else {
			toasts.show('Failed to fetch user profile', 'error');
		}
	}

	async function handleAuth() {
		if (!validateForm()) return;
		loading = true;
		try {
			if (activeTab === 'signin') {
				const res = await authService.login(email, password);
				if (res.mfaRequired) {
					toasts.show('Two-factor authentication required', 'info');
					goto('/auth/mfa/otp');
				} else {
					await completeAuthentication();
				}
			} else {
				// Registration Flow (No MFA check here as per your feedback)
				await authService.register({ username, email, password });
				await completeAuthentication();
			}
		} catch (err: any) {
			if (err.fieldErrors) {
				fieldErrors = err.fieldErrors;
			} else {
				toasts.show(err.message || 'Server error', 'error');
			}
		} finally {
			loading = false;
		}
	}

	function switchTab(tab: 'signin' | 'create') {
		activeTab = tab;
		fieldErrors = {};
	}
</script>

<div class="flex min-h-[100dvh] w-full flex-col items-center pt-[10dvh] sm:pt-[15dvh] p-4 bg-background transition-all">
	
	<div class="flex flex-col items-center mb-10">
		<h1 class="text-4xl font-bold tracking-tight text-white italic">Quingo</h1>
	</div>

	<div class="w-full max-w-[440px] rounded-[2rem] border border-white/5 bg-surface p-6 sm:p-10 shadow-2xl overflow-hidden h-fit">
		
		<!-- Tabs -->
		<div class="flex p-1.5 bg-slate-950/80 rounded-xl mb-8 border border-white/5">
			<button onclick={() => switchTab('signin')} class={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", activeTab === 'signin' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-400")}>
				Sign In
			</button>
			<button onclick={() => switchTab('create')} class={cn("flex-1 py-2.5 text-sm font-bold rounded-lg transition-all", activeTab === 'create' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-400")}>
				Create Account
			</button>
		</div>

		<form class="flex flex-col gap-5" onsubmit={(e) => { e.preventDefault(); handleAuth(); }}>
			{#if activeTab === 'create'}
				<div transition:slide={{ duration: 200 }}>
					<Input bind:value={username} label="Username" placeholder="alex_morgan" icon={User} error={fieldErrors.username} />
				</div>
			{/if}

			<Input bind:value={email} label="Email Address" placeholder="you@example.com" icon={Mail} error={fieldErrors.email} />
			
			<div class="space-y-2">
				<Input bind:value={password} type="password" label="Password" placeholder="Enter password" icon={Lock} error={fieldErrors.password} />
				{#if activeTab === 'signin'}
					<div transition:slide={{ duration: 150 }} class="flex justify-end px-1">
						<a href="/auth/recovery" class="text-[10px] font-semibold text-primary uppercase tracking-wider hover:text-primary-hover transition-colors">Forgot password?</a>
					</div>
				{/if}
			</div>

			{#if activeTab === 'create'}
				<div transition:slide={{ duration: 200 }}>
					<Input bind:value={confirmPassword} type="password" label="Confirm Password" placeholder="Repeat password" icon={CheckCircle2} error={fieldErrors.confirmPassword || (passwordMismatch ? 'Passwords do not match' : null)} />
				</div>
			{/if}

			<Button type="submit" class="w-full py-4 text-base mt-2" isLoading={loading}>
				{activeTab === 'signin' ? 'Sign In' : 'Create Account'} 
				<ArrowRight size={18} class="ml-1" />
			</Button>
		</form>

		<div class="flex items-center gap-4 my-10">
			<div class="flex-grow border-t border-white/5"></div>
			<span class="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">Or continue with</span>
			<div class="flex-grow border-t border-white/5"></div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<Button variant="secondary" class="font-bold py-3 px-4 rounded-lg border-white/5" onclick={() => window.location.href = 'https://quingo.arhr.tech/api/auth/oauth2/authorization/google'}>
				<svg class="w-5 h-5 mr-2 shrink-0" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
				Google
			</Button>
			<Button variant="secondary" class="font-bold py-3 px-4 rounded-lg border-white/5" onclick={() => window.location.href = 'https://quingo.arhr.tech/api/auth/oauth2/authorization/github'}>
				<svg class="w-5 h-5 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
				GitHub
			</Button>
		</div>
	</div>
</div>