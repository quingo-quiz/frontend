<script lang="ts">
    import { toasts } from '$lib/runes/toast.svelte';
    import { flip } from 'svelte/animate';
    import { fly } from 'svelte/transition';
    import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
    import { cn } from '$lib/utils/ui';
</script>

<!-- Позиционирование сверху по центру -->
<div class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-[400px] px-4">
    {#each toasts.list as toast (toast.id)}
        <div 
            animate:flip={{ duration: 200 }}
            transition:fly={{ y: -20, duration: 300 }}
            class={cn(
                "flex items-center gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md",
                toast.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                toast.type === 'info' && "bg-primary/10 border-primary/20 text-primary"
            )}
        >
            {#if toast.type === 'success'} <CheckCircle size={18} /> {/if}
            {#if toast.type === 'error'} <AlertCircle size={18} /> {/if}
            {#if toast.type === 'info'} <Info size={18} /> {/if}
            
            <p class="text-sm font-medium flex-grow leading-tight">{toast.message}</p>
            
            <button onclick={() => toasts.dismiss(toast.id)} class="opacity-50 hover:opacity-100 transition-opacity">
                <X size={16} />
            </button>
        </div>
    {/each}
</div>