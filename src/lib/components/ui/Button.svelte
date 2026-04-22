<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import { Loader2 } from 'lucide-svelte';

	type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'secondary';
	type ButtonType = 'button' | 'submit' | 'reset';

	interface Props {
		onclick?: (e: MouseEvent) => void;
		type?: ButtonType;
		variant?: ButtonVariant;
		isLoading?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		onclick,
		type = 'button',
		variant = 'primary',
		isLoading = false,
		disabled = false,
		class: className = ''
	}: Props = $props();

	const variants: Record<ButtonVariant, string> = {
		primary: 'bg-primary text-white hover:bg-primary-hover shadow-primary-glow',
		outline: 'border border-border bg-transparent hover:bg-white/5 text-foreground',
		ghost: 'bg-transparent hover:bg-white/5 text-foreground-muted hover:text-foreground',
		secondary: 'bg-slate-800/50 text-foreground-muted hover:text-white border border-border/50'
	};
</script>

<button
	{type}
	disabled={disabled || isLoading}
	on:click={onclick}
	aria-busy={isLoading}
	aria-disabled={disabled || isLoading}
	class={cn(
		'relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60',
		variants[variant],
		className
	)}
>
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
			<Loader2 class="h-5 w-5 animate-spin" />
		</div>
	{/if}
	<span class={cn('flex items-center gap-2 transition-opacity', isLoading ? 'opacity-0' : 'opacity-100')}>
		<slot />
	</span>
</button>