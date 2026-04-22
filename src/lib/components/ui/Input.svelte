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
		...rest
	} = $props();

	let showPassword = $state(false);
	let isPassword = $derived(type === 'password');
</script>

<div class={cn('flex w-full flex-col gap-1.5', className)}>
	{#if label}
		<label class="text-[11px] font-medium uppercase tracking-wider text-slate-500 px-1" for={rest.id}>
			{label}
		</label>
	{/if}

	<div class="relative group">
		{#if Icon}
			<div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500/80 group-focus-within:text-primary transition-colors">
				<Icon size={18} strokeWidth={2} />
			</div>
		{/if}

		<input
			{...rest}
			bind:value
			type={isPassword ? (showPassword ? 'text' : 'password') : type}
			{placeholder}
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
				class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
			>
				{#if showPassword} <EyeOff size={18} /> {:else} <Eye size={18} /> {/if}
			</button>
		{/if}
	</div>

	{#if error}
		<div class="flex items-center gap-1.5 px-1 text-red-400 mt-1">
			<AlertCircle size={14} />
			<span class="text-xs font-medium">{error}</span>
		</div>
	{/if}
</div>