<script lang="ts">
	import TestButton from '$lib/components/ui/TestButton.svelte';
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
	<h1 class="mb-4 text-4xl font-bold tracking-tight">Quingo Platform</h1>
	<p class="mb-8 text-slate-400">Инфраструктура готова. Проверка связи:</p>

	<TestButton label="Счетчик проверок" />
</main>