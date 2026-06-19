<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { userContext } from '$lib/runes/user.svelte';
</script>

<svelte:head><title>Quingo — Quizzes</title></svelte:head>

<div class="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
	<h1 class="mb-4 text-5xl font-bold italic">Quingo</h1>
	<p class="mb-8 max-w-md text-slate-400">
		{#if userContext.user}
			С возвращением, {userContext.user.username}! Создавай и проводи свои квизы.
		{:else}
			Платформа для создания и проведения квизов.
		{/if}
	</p>
	{#if userContext.user}
		<a
			href="/quizzes"
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.97]"
		>
			My Quizzes <ArrowRight size={18} />
		</a>
	{:else}
		<a
			href="/auth"
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.97]"
		>
			Sign In <ArrowRight size={18} />
		</a>
	{/if}
</div>
