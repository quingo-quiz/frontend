<script lang="ts">
    import '../app.css'; // Глобальные стили
    import ToastContainer from '$lib/components/ui/ToastContainer.svelte'; // Глобальные тосты
    let { children } = $props();
</script>

<ToastContainer />
{@render children()}