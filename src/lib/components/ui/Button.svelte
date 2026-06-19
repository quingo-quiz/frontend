<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import { Loader2 } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet; // Вместо <slot />
		onclick?: (e: MouseEvent) => void;
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
		isLoading?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		children,
		onclick,
		type = 'button',
		variant = 'primary',
		isLoading = false,
		disabled = false,
		class: className = ''
	}: Props = $props();

	const variants = {
		primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
		outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-foreground',
		ghost: 'bg-transparent hover:bg-white/5 text-foreground-muted hover:text-foreground',
		secondary: 'bg-slate-800/50 text-foreground-muted hover:text-white border border-white/5'
	};
</script>

<button
	{type}
	disabled={disabled || isLoading}
	{onclick}
	class={cn(
		'relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60',
		variants[variant],
		className
	)}
>
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center">
			<Loader2 class="h-5 w-5 animate-spin" />
		</div>
	{/if}
	<span
		class={cn(
			'flex items-center gap-2 transition-opacity',
			isLoading ? 'opacity-0' : 'opacity-100'
		)}
	>
		{@render children()}
	</span>
</button>
