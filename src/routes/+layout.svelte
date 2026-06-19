<script lang="ts">
    import '../app.css'; // Глобальные стили
    import ToastContainer from '$lib/components/ui/ToastContainer.svelte'; // Глобальные тосты
    import favicon from '$lib/assets/favicon.svg'; // тот же логотип, что в хедере
    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <!-- Дефолтный заголовок; страницы переопределяют своим <title> -->
    <title>Quingo</title>
    <meta name="description" content="Quingo — платформа для создания и проведения квизов." />
</svelte:head>

<ToastContainer />
{@render children()}