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
    <div class="absolute inset-0 bg-black/50" role="button" tabindex="0" onclick={onClose} onkeydown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onClose(); }}></div>
    <div class="relative w-full max-w-md p-6 rounded-2xl bg-surface border border-white/5 shadow-2xl">
      <h3 class="text-lg font-bold text-white mb-2">{title}</h3>
      <p class="text-sm text-slate-400 mb-6">{message}</p>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" onclick={onClose} disabled={isLoading}>{cancelLabel}</Button>
        <Button variant="secondary" isLoading={isLoading} onclick={() => { onConfirm(); }} class={destructive ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : ''}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Placeholder: rely on global styles/tailwind */
</style>
