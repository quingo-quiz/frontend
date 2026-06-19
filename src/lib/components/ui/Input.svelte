<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-svelte';

	let {
		value = $bindable(),
		type = 'text',
		label = '',
		placeholder = '',
		error = null,
		icon: Icon = null,
		locked = false,
		lockedHint = 'This field cannot be changed here',
		class: className = '',
		id: propId = undefined,
		...rest
	} = $props();

	let showPassword = $state(false);
	let isPassword = $derived(type === 'password');

	// Генерируем id, если не передан — это нужно для доступности label->input.
	// $props.id() даёт стабильный id (совпадает на сервере и клиенте — без mismatch при гидратации).
	const uid = $props.id();
	let id = $derived(propId ?? rest.id ?? `input-${uid}`);
	let errorId = $derived(`${id}-error`);
</script>

<div class={cn('flex w-full flex-col gap-1.5', className)}>
	{#if label}
		<label class="px-1 text-[11px] font-medium tracking-wider text-slate-500 uppercase" for={id}>
			{label}
		</label>
	{/if}

	<div class="group relative">
		{#if Icon}
			<div
				class="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500/80 transition-colors group-focus-within:text-primary"
				aria-hidden="true"
			>
				<Icon size={18} strokeWidth={2} />
			</div>
		{/if}

		<input
			{...rest}
			{id}
			bind:value
			disabled={locked || rest.disabled}
			type={isPassword ? (showPassword ? 'text' : 'password') : type}
			{placeholder}
			title={locked ? lockedHint : rest.title}
			aria-invalid={error ? 'true' : 'false'}
			aria-describedby={error ? errorId : undefined}
			class={cn(
				/* border-white/5 — то самое очень тонкое обрамление */
				'flex w-full rounded-lg border border-white/10 bg-input-bg px-4 py-3 text-sm text-white transition-all placeholder:text-slate-600 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none disabled:opacity-50',
				Icon && 'pl-12',
				(isPassword || locked) && 'pr-12',
				locked && 'cursor-not-allowed border-white/5 bg-slate-950/50 text-slate-400 italic',
				error && 'border-red-500/40 ring-2 ring-red-500/10'
			)}
		/>

		{#if locked}
			<div
				class="absolute top-1/2 right-4 -translate-y-1/2 text-slate-500"
				aria-hidden="true"
				title={lockedHint}
			>
				<Lock size={16} />
			</div>
		{/if}

		{#if isPassword}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				class="absolute top-1/2 right-4 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
			>
				{#if showPassword}
					<EyeOff size={18} aria-hidden="true" />
				{:else}
					<Eye size={18} aria-hidden="true" />
				{/if}
			</button>
		{/if}
	</div>

	{#if error}
		<div
			id={errorId}
			role="alert"
			aria-live="polite"
			class="mt-1 flex items-center gap-1.5 px-1 text-red-400"
		>
			<AlertCircle size={14} aria-hidden="true" />
			<span class="text-xs font-medium">{error}</span>
		</div>
	{/if}
</div>
