<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import { Eye, EyeOff, AlertCircle } from 'lucide-svelte';

	let {
		value = $bindable(),
		type = 'text',
		label = '',
		placeholder = '',
		error = null,
		icon: Icon = null,
		class: className = '',
		id: propId = undefined,
		...rest
	} = $props();

	let showPassword = $state(false);
	let isPassword = $derived(type === 'password');

	// Генерируем id, если не передан — это нужно для доступности label->input
	let id = propId ?? rest.id ?? `input-${Math.random().toString(36).slice(2, 9)}`;
	let errorId = `${id}-error`;
</script>

<div class={cn('flex w-full flex-col gap-1.5', className)}>
	{#if label}
		<label class="text-[11px] font-medium uppercase tracking-wider text-slate-500 px-1" for={id}>
			{label}
		</label>
	{/if}

	<div class="relative group">
		{#if Icon}
			<div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500/80 group-focus-within:text-primary transition-colors" aria-hidden="true">
				<Icon size={18} strokeWidth={2} />
			</div>
		{/if}

		<input
			{...rest}
			id={id}
			bind:value
			type={isPassword ? (showPassword ? 'text' : 'password') : type}
			{placeholder}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
			class={cn(
				/* border-white/5 — то самое очень тонкое обрамление */
				'flex w-full rounded-lg border border-white/10 bg-input-bg py-3 px-4 text-sm text-white placeholder:text-slate-600 transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none disabled:opacity-50',
				Icon && 'pl-12',
				isPassword && 'pr-12',
				error && 'border-red-500/40 ring-2 ring-red-500/10'
			)}
		/>

		{#if isPassword}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
			>
				{#if showPassword} <EyeOff size={18} aria-hidden="true" /> {:else} <Eye size={18} aria-hidden="true" /> {/if}
			</button>
		{/if}
	</div>

	{#if error}
		<div id={errorId} role="alert" aria-live="polite" class="flex items-center gap-1.5 px-1 text-red-400 mt-1">
			<AlertCircle size={14} aria-hidden="true" />
			<span class="text-xs font-medium">{error}</span>
		</div>
	{/if}
</div>