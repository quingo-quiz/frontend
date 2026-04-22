<script lang="ts">
	let { label = 'Click me' } = $props(); 
	let count = $state(0);
</script>

<button
	onclick={() => count++}
	class="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition-colors hover:bg-orange-600 active:scale-95"
>
	{label}: {count}
</button>