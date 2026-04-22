<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { Mail, ChevronLeft } from 'lucide-svelte';

	let email = $state('');
	let loading = $state(false);
</script>

<div class="flex min-h-[100dvh] flex-col items-center justify-center p-4">
	<div class="w-full max-w-[440px] rounded-[2rem] border border-white/5 bg-surface p-8 sm:p-10 shadow-2xl">
		<a href="/auth" class="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-medium">
			<ChevronLeft size={16} /> Back to Sign In
		</a>
		
		<h2 class="text-2xl font-bold mb-2">Forgot Password?</h2>
		<p class="text-slate-500 text-sm mb-8 font-medium">Enter your email and we'll send you a link to reset your password.</p>

		<form class="space-y-6" onsubmit={(e) => { e.preventDefault(); loading = true; }}>
			<Input bind:value={email} label="Email Address" placeholder="you@example.com" icon={Mail} />
			<Button type="submit" class="w-full py-4 text-base" isLoading={loading}>Send Reset Link</Button>
		</form>
	</div>
</div>