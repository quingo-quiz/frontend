<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { userContext } from '$lib/runes/user.svelte';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
	<h1 class="text-5xl font-bold mb-4 italic">Quingo</h1>
	<p class="text-slate-400 mb-8 max-w-md">
		{#if userContext.user}
			С возвращением, {userContext.user.username}! Создавай и проводи свои квизы.
		{:else}
			Платформа для создания и проведения квизов.
		{/if}
	</p>
	<a href="/quizzes" class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.97]">
		My Quizzes <ArrowRight size={18} />
	</a>
</div>
