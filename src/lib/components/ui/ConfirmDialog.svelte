<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		isOpen?: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		isLoading?: boolean;
		onConfirm?: () => void;
		onClose?: () => void;
	}

	let {
		isOpen = false,
		title = 'Confirm',
		message = '',
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		destructive = false,
		isLoading = false,
		onConfirm = () => {},
		onClose = () => {}
	}: Props = $props();
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div
			class="absolute inset-0 bg-black/50"
			role="button"
			tabindex="0"
			onclick={onClose}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === 'Escape') onClose();
			}}
		></div>
		<div
			class="relative w-full max-w-md rounded-2xl border border-white/5 bg-surface p-6 shadow-2xl"
		>
			<h3 class="mb-2 text-lg font-bold text-white">{title}</h3>
			<p class="mb-6 text-sm text-slate-400">{message}</p>
			<div class="flex justify-end gap-3">
				<Button variant="ghost" onclick={onClose} disabled={isLoading}>{cancelLabel}</Button>
				<Button
					variant="secondary"
					{isLoading}
					onclick={() => {
						onConfirm();
					}}
					class={destructive ? 'border-red-600 bg-red-600 text-white hover:bg-red-700' : ''}
				>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Placeholder: rely on global styles/tailwind */
</style>
