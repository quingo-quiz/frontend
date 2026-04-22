<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-grow container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>